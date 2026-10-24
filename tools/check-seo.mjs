/**
 * The guard on what search engines and link previews read from every built page.
 *
 * Each page carries a title and a description of its own, in lengths a result page shows whole, the
 * language of the site, the Open Graph and Twitter tags of a link preview, one h1 and headings that never
 * skip a level, images with a text alternative and a size, and links that say where they lead. Its JSON-LD
 * parses and fits the page: the organization and the site on the home, the trail to the page everywhere
 * else, and a list that counts its own items. A page that asks to stay out of the index stays out of the
 * sitemap, and every other page is in it, which robots.txt points to.
 *
 * It reads `dist/`, so it runs after the build, prints every page and fails when any check does.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const DIST = 'dist'
const SITE = 'https://backend-br.github.io'
const TITLE = { min: 10, max: 70 }
const DESCRIPTION = { min: 50, max: 160 }
/** Link texts that say nothing about where they lead. */
const VAGUE = /^(clique aqui|aqui|saiba mais|leia mais|ver mais|mais|veja mais|link|ver no site)$/i

function pages(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    if (statSync(path).isDirectory()) {
      return name === 'pagefind' ? [] : pages(path)
    }
    return name.endsWith('.html') ? [path] : []
  })
}

/** The entities the build escapes in attributes, decoded in one pass so `&amp;lt;` stays `&lt;`. */
const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }

function decode(text) {
  return text.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity])
}

function meta(html, attribute, name) {
  const tag = [...html.matchAll(/<meta\s[^>]*>/g)]
    .map((match) => match[0])
    .find((candidate) => candidate.includes(`${attribute}="${name}"`))
  const content = tag && /content="([^"]*)"/.exec(tag)
  return content ? decode(content[1]) : null
}

function nodesOf(data) {
  const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data]
  return graph.flatMap((node) => [node, ...(node.mainEntity ? [node.mainEntity] : [])])
}

function checkStructuredData(html, page, problems) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  const types = []
  for (const block of blocks) {
    let data
    try {
      data = JSON.parse(block[1])
    } catch (error) {
      problems.push(`JSON-LD does not parse: ${error.message}`)
      continue
    }
    if (data['@context'] !== 'https://schema.org') {
      problems.push('JSON-LD without the schema.org context')
    }
    for (const node of nodesOf(data)) {
      if (typeof node['@type'] !== 'string') {
        problems.push('JSON-LD node without a type')
        continue
      }
      types.push(node['@type'])
      const list = node.itemListElement
      if (node['@type'] === 'BreadcrumbList' || node['@type'] === 'ItemList') {
        if (!Array.isArray(list) || list.length === 0) {
          problems.push(`${node['@type']} without items`)
          continue
        }
        list.forEach((item, index) => {
          // An entry is linked by its url, or by the thing it holds, given as its address or in full.
          const held = typeof item.item === 'object' ? item.item : null
          const target = held?.url ?? item.item ?? item.url
          const name = held?.name ?? item.name
          if (item.position !== index + 1 || typeof name !== 'string' || !/^https:\/\//.test(target ?? '')) {
            problems.push(`${node['@type']} item ${index + 1} is malformed`)
          }
        })
        if (node['@type'] === 'BreadcrumbList' && list.at(-1).item !== `${SITE}/${page.replace(/index\.html$/, '')}`) {
          problems.push('BreadcrumbList does not end at the page')
        }
        if (node['@type'] === 'ItemList' && node.numberOfItems !== list.length) {
          problems.push('ItemList counts a different number of items than it lists')
        }
      }
    }
  }
  return types
}

function checkHeadings(html, problems) {
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((match) => Number(match[1]))
  if (levels.filter((level) => level === 1).length !== 1) {
    problems.push(`${levels.filter((level) => level === 1).length} h1 elements`)
  }
  levels.forEach((level, index) => {
    if (index > 0 && level > levels[index - 1] + 1) {
      problems.push(`heading skips from h${levels[index - 1]} to h${level}`)
    }
  })
}

function checkMarkup(html, problems) {
  for (const image of html.matchAll(/<img\s[^>]*>/g)) {
    if (!/\salt(="|[\s>])/.test(image[0]) || !/\swidth="/.test(image[0]) || !/\sheight="/.test(image[0])) {
      problems.push(`image without alt, width or height: ${image[0].slice(0, 80)}`)
    }
  }
  for (const link of html.matchAll(/<a\s([^>]*)>([\s\S]*?)<\/a>/g)) {
    const text = decode(
      link[2]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    const label = /aria-label="([^"]*)"/.exec(link[1])?.[1]
    if (text === '' && !label) {
      problems.push(`link without a name: ${link[1].slice(0, 80)}`)
    }
    if (VAGUE.test(text) && !label) {
      problems.push(`vague link text: ${text}`)
    }
  }
}

const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8')
const listed = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]))
const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8')
const titles = new Map()
const descriptions = new Map()
const results = []
const problems = []

if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) {
  problems.push('robots.txt: does not point to the sitemap')
}

for (const path of pages(DIST)) {
  const page = relative(DIST, path)
  const html = readFileSync(path, 'utf8')
  const found = []
  const title = decode(/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '')
  const description = meta(html, 'name', 'description') ?? ''
  const noindex = meta(html, 'name', 'robots') === 'noindex'
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1] ?? null
  const address = `${SITE}/${page.replace(/index\.html$/, '')}`

  if (!/<html lang="pt-BR"/.test(html)) found.push('html lang is not pt-BR')
  if (title.length < TITLE.min || title.length > TITLE.max) found.push(`title of ${title.length} characters`)
  if (description.length < DESCRIPTION.min || description.length > DESCRIPTION.max) {
    found.push(`description of ${description.length} characters`)
  }
  titles.set(title, [...(titles.get(title) ?? []), page])
  descriptions.set(description, [...(descriptions.get(description) ?? []), page])

  const isMissing = page === '404.html'
  if (isMissing) {
    if (!noindex) found.push('the 404 page is not noindex')
  } else if (canonical !== address) {
    found.push(`canonical is ${canonical}`)
  }
  if (noindex && listed.has(address)) found.push('noindex page is in the sitemap')
  if (!noindex && !listed.has(address)) found.push('indexable page is missing from the sitemap')

  const preview = {
    'og:title': title,
    'og:description': description,
    'og:site_name': 'Back-End Brasil',
    'og:locale': 'pt_BR',
    'og:image': `${SITE}/og-image.png`,
    'og:image:width': '1200',
    'og:image:height': '630',
  }
  for (const [property, expected] of Object.entries(preview)) {
    if (meta(html, 'property', property) !== expected) found.push(`${property} is ${meta(html, 'property', property)}`)
  }
  if (!meta(html, 'property', 'og:image:alt')) found.push('og:image:alt is missing')
  if (!isMissing && meta(html, 'property', 'og:url') !== address) found.push('og:url is not the page')
  if (meta(html, 'name', 'twitter:card') !== 'summary_large_image') found.push('twitter:card is missing')
  if (!meta(html, 'name', 'theme-color')) found.push('theme-color is missing')

  const types = checkStructuredData(html, page, found)
  if (page === 'index.html') {
    for (const type of ['Organization', 'WebSite']) if (!types.includes(type)) found.push(`no ${type} in JSON-LD`)
  } else if (!isMissing && !types.includes('BreadcrumbList')) {
    found.push('no BreadcrumbList in JSON-LD')
  }
  checkHeadings(html, found)
  checkMarkup(html, found)

  results.push({ page, title, description: description.length, types: [...new Set(types)].join(' '), found })
  problems.push(...found.map((problem) => `${page}: ${problem}`))
}

for (const [map, kind] of [
  [titles, 'title'],
  [descriptions, 'description'],
]) {
  for (const [text, where] of map) {
    if (where.length > 1) problems.push(`${kind} shared by ${where.join(', ')}: ${text}`)
  }
}

for (const { page, title, description, types, found } of results) {
  console.log(`${found.length > 0 ? 'FAIL' : 'ok  '}  ${page}`)
  console.log(`      title (${title.length}): ${title}`)
  console.log(`      description: ${description} characters, JSON-LD: ${types || 'none'}`)
}
if (problems.length > 0) {
  console.error(`\n${problems.join('\n')}`)
  process.exit(1)
}
console.log(`\nEvery page passes the SEO checks, and the sitemap lists the ${listed.size} indexable pages.`)
