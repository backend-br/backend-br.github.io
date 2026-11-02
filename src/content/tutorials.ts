import { blobUrl, rawUrl } from './catalog'
import { absoluteLinks, plainText, sections } from './markdown'

export const REPOSITORY = 'como-instalar-xyz'

const TUTORIALS = 'tutoriais'

const README = 'README.md'

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g

const CATEGORY = /^###\s+(.+)$/

const SYSTEM_IN_TITLE = /\s+n[oa]\s+(.+)$/

export interface ToolEntry {
  readonly category: string
  readonly name: string
  readonly slug: string
  readonly paths: readonly string[]
}

export interface ToolPage {
  readonly summary: string
  readonly paths: readonly string[]
}

export interface Tutorial {
  readonly title: string
  readonly system: string
  readonly summary: string
  readonly body: string
}

function directoryOf(path: string): string {
  return path.split('/').slice(0, -1).join('/')
}

export function joined(directory: string, target: string): string {
  const segments: string[] = directory === '' ? [] : directory.split('/')
  for (const segment of target.replace(/^\.\//, '').split('/')) {
    if (segment === '..') {
      segments.pop()
    } else if (segment !== '.' && segment !== '') {
      segments.push(segment)
    }
  }
  return segments.join('/')
}

function localLinks(text: string, directory: string): string[] {
  return [...text.matchAll(LINK)]
    .map((match) => match[2] ?? '')
    .filter((target) => !/^([a-z][a-z0-9+.-]*:|#)/i.test(target))
    .map((target) => joined(directory, target.split('#')[0] ?? ''))
    .filter((path) => path.startsWith(`${TUTORIALS}/`))
}

export function toolSlug(path: string): string {
  return (path.split('/')[1] ?? '').toLowerCase()
}

export function isToolIndex(path: string): boolean {
  return path.endsWith(`/${README}`) || !path.endsWith('.md')
}

export function toolReadmeOf(path: string): string {
  return `${path.split('/').slice(0, 2).join('/')}/${README}`
}

export function toolIndexPath(path: string): string {
  return path.endsWith('.md') ? path : `${path}/${README}`
}

export function toolIndex(readme: string): ToolEntry[] {
  const tools: ToolEntry[] = []
  let category = ''
  for (const line of readme.replace(/\r\n/g, '\n').split('\n')) {
    const heading = CATEGORY.exec(line.trim())
    if (heading) {
      category = (heading[1] ?? '').trim()
      continue
    }
    if (!line.trim().startsWith('|') || category === '') {
      continue
    }
    const [name = '', ...cells] = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|')
    const paths = [...new Set(localLinks(cells.join(' '), ''))]
    if (paths.length > 0) {
      tools.push({ category, name: name.trim(), slug: toolSlug(paths[0] ?? ''), paths })
    }
  }
  return tools
}

function paragraphs(lines: readonly string[]): string[] {
  return lines
    .filter((line) => !/^# /.test(line))
    .join('\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '')
}

export function toolPage(path: string, markdown: string): ToolPage {
  const [intro = []] = sections(markdown)
  const [first = ''] = paragraphs(intro)
  return { summary: plainText(first), paths: [...new Set(localLinks(markdown, directoryOf(path)))] }
}

function systemFromPath(path: string): string {
  const name = (path.split('/').at(-1) ?? '').replace(/\.md$/, '')
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function tutorial(path: string, markdown: string): Tutorial {
  const [intro = [], ...rest] = sections(markdown)
  const title =
    intro
      .find((line) => /^# /.test(line))
      ?.replace(/^# /, '')
      .trim() ?? systemFromPath(path)
  const [first = '', ...more] = paragraphs(intro)
  const body = [more.join('\n\n'), ...rest.map((part) => part.join('\n'))].join('\n\n').trim()
  const directory = directoryOf(path)
  const base = { blob: blobUrl(REPOSITORY, directory), raw: rawUrl(REPOSITORY, directory) }
  return {
    title,
    system: SYSTEM_IN_TITLE.exec(title)?.[1]?.trim() ?? systemFromPath(path),
    summary: plainText(first),
    body: absoluteLinks(body, base),
  }
}

export function tutorialPage(tool: string, system: string): string {
  return `/tutoriais/${tool}/${systemSlug(system)}/`
}

export function toolSection(tool: string): string {
  return `/tutoriais/#${tool}`
}

export function withSiteLinks(body: string, routes: ReadonlyMap<string, string>): string {
  const blob = blobUrl(REPOSITORY, '')
  return body.replace(/\]\(([^)\s]+)\)/g, (link: string, target: string) => {
    if (!target.startsWith(blob)) {
      return link
    }
    const [path = '', anchor] = target.slice(blob.length).split('#')
    const route = routes.get(path.replace(/\/(README\.md)?$/, ''))
    if (route === undefined) {
      return link
    }
    return `](${anchor && !route.includes('#') ? `${route}#${anchor}` : route})`
  })
}

export function systemSlug(system: string): string {
  return system
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
