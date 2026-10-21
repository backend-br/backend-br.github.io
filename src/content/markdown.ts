/**
 * Reading the Markdown the repositories of the community are written in: their sections, their tables
 * and their links. Nothing here reads the network, so every repository is parsed the same way in the
 * build and in the tests.
 */

const FENCE = /^\s*(```|~~~)/

/** Answers the document split at its `##` headings, a heading inside a code block left as code. */
export function sections(markdown: string): string[][] {
  const parts: string[][] = [[]]
  let fenced = false
  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    if (FENCE.test(line)) {
      fenced = !fenced
    }
    if (!fenced && /^## /.test(line)) {
      parts.push([])
    }
    parts.at(-1)?.push(line)
  }
  return parts
}

/** Answers the title of a section, in lower case, or an empty title for the part before the first one. */
export function headingOf(section: readonly string[]): string {
  const first = section[0] ?? ''
  return /^## /.test(first) ? first.replace(/^## /, '').trim().toLowerCase() : ''
}

/**
 * Answers the cells of every row of the tables in some lines, leaving out each header row and the row
 * of dashes under it.
 */
export function tableRows(lines: readonly string[]): string[][] {
  const rows: string[][] = []
  let header = true
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) {
      header = true
      continue
    }
    const cells = trimmed
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim())
    if (cells.every((cell) => /^:?-+:?$/.test(cell))) {
      continue
    }
    if (header) {
      header = false
      continue
    }
    rows.push(cells)
  }
  return rows
}

export interface Link {
  readonly label: string
  readonly url: string
}

/** Answers every Markdown link of a text, in the order they are written. */
export function links(text: string): Link[] {
  return [...text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)].map((match) => ({
    label: (match[1] ?? '').trim(),
    url: match[2] ?? '',
  }))
}

/** Answers the first address of a text, written bare or as a Markdown link, or null when there is none. */
export function firstUrl(text: string): string | null {
  return /https?:\/\/[^\s)|>\]]+/.exec(text)?.[0] ?? null
}

/** Answers a Markdown text as the plain words a reader sees, the way a summary or a description needs it. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Answers the address a link of a document should lead to on the site. An absolute address, an anchor
 * and a mailto stay as they are. A path relative to the document leads to the file on GitHub, and an
 * image is read from where GitHub serves it as it is.
 */
export function resolve(target: string, image: boolean, base: { blob: string; raw: string }): string {
  if (/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(target)) {
    return target
  }
  const path = target.replace(/^\.?\//, '')
  return `${image ? base.raw : base.blob}/${path}`
}

/** Answers a document with every link and image relative to it made absolute. */
export function absoluteLinks(markdown: string, base: { blob: string; raw: string }): string {
  return markdown
    .replace(/(!?)\[([^\]]*)\]\(([^)\s]+)\)/g, (_, bang: string, label: string, target: string) => {
      return `${bang}[${label}](${resolve(target, bang === '!', base)})`
    })
    .replace(/(<img[^>]*\ssrc=")([^"]+)(")/g, (_, open: string, target: string, close: string) => {
      return `${open}${resolve(target, true, base)}${close}`
    })
}
