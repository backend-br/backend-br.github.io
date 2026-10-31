import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const DIST = 'dist'
const BUDGET = 4000
const BASE = '/'

function pages(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    if (statSync(path).isDirectory()) {
      return name === 'pagefind' ? [] : pages(path)
    }
    return name.endsWith('.html') ? [path] : []
  })
}

function moduleClosure(file, seen) {
  if (seen.has(file)) {
    return
  }
  seen.add(file)
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(/(?:import|from)\s*["']([^"']+\.js)["']/g)) {
    moduleClosure(join(dirname(file), match[1]), seen)
  }
}

function scriptBytes(page) {
  const html = readFileSync(page, 'utf8')
  const inline = [
    ...html.matchAll(/<script(?![^>]*\b(?:src=|type="application\/ld\+json"))[^>]*>([\s\S]*?)<\/script>/g),
  ].reduce((total, match) => total + Buffer.byteLength(match[1]), 0)
  const files = new Set()
  for (const match of html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)) {
    moduleClosure(join(DIST, match[1].replace(BASE, '')), files)
  }
  return [...files].reduce((total, file) => total + statSync(file).size, inline)
}

const results = pages(DIST).map((page) => ({ page: relative(DIST, page), bytes: scriptBytes(page) }))
for (const { page, bytes } of results) {
  console.log(`${bytes > BUDGET ? 'OVER' : 'ok  '}  ${String(bytes).padStart(5)} B  ${page}`)
}

const over = results.filter(({ bytes }) => bytes > BUDGET)
if (over.length > 0) {
  console.error(`\n${over.length} page(s) over the ${BUDGET} B script budget.`)
  process.exit(1)
}
console.log(`\nEvery page is within the ${BUDGET} B script budget.`)
