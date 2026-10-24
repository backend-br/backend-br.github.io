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

/**
 * How code is colored, at build time in both themes, with the stylesheet picking the one in force. The high
 * contrast editions are used because the comments of the plain ones fall to 3:1 on their own ground.
 */
export const SHIKI = {
  themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
  defaultColor: false,
} as const

/** A node of the HTML tree a Markdown document becomes, reduced to what the plugins below read. */
interface HtmlNode {
  type: string
  value?: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HtmlNode[]
}

/** The addresses a link or an image written by anyone may carry: the web, mail and an anchor of the page. */
const SAFE_URL = /^(https?:|mailto:|#)/i

/**
 * The rehype plugin for Markdown written by anyone, such as the text of an opening. It drops every piece of
 * raw HTML, so only what Markdown itself writes is left, drops an address that is not safe to follow, and
 * marks every link that leaves the site so it opens beside the page.
 */
export function rehypeUntrusted() {
  const visit = (node: HtmlNode): void => {
    if (node.children) {
      node.children = node.children.filter((child) => child.type !== 'raw')
    }
    if (node.type === 'element' && node.properties) {
      for (const key of ['href', 'src']) {
        const value = node.properties[key]
        if (value !== undefined && !SAFE_URL.test(String(value).trim())) {
          delete node.properties[key]
        }
      }
      if (node.tagName === 'a' && /^https?:/i.test(String(node.properties.href ?? ''))) {
        node.properties = { ...node.properties, target: '_blank', rel: 'noopener noreferrer nofollow ugc' }
      }
    }
    node.children?.forEach(visit)
  }
  return visit
}

/**
 * The rehype plugin that fits the headings of a document written by anyone under the title of the page it
 * is shown in. The first heading becomes a second level one, and none goes more than one level below the
 * one before it, so the outline of the page never skips a level, however the author numbered it.
 */
export function rehypeOutline() {
  let last = 1
  const visit = (node: HtmlNode): void => {
    const level = /^h([1-6])$/.exec(node.tagName ?? '')?.[1]
    if (node.type === 'element' && level) {
      last = Math.max(2, Math.min(Number(level), last + 1))
      node.tagName = `h${last}`
    }
    node.children?.forEach(visit)
  }
  return (tree: HtmlNode): void => {
    last = 1
    visit(tree)
  }
}

/** The elements whose text is read as lines of prose, where a new line is a break. */
const PROSE = new Set(['p', 'li', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'strong', 'em', 'del'])

/**
 * The rehype plugin that keeps the line breaks of a text the way GitHub shows an issue, where a single new
 * line inside a paragraph is a break rather than a space. Only the text of prose breaks: the space between
 * blocks stays space, and code keeps its lines as they are.
 */
export function rehypeLineBreaks() {
  const visit = (node: HtmlNode): void => {
    if (!node.children) {
      return
    }
    if (node.type === 'element' && PROSE.has(node.tagName ?? '')) {
      node.children = node.children.flatMap((child) => {
        if (child.type !== 'text' || !child.value?.trim() || !child.value.includes('\n')) {
          return [child]
        }
        return child.value
          .split('\n')
          .flatMap((line, index): HtmlNode[] => [
            ...(index > 0 ? [{ type: 'element', tagName: 'br', properties: {}, children: [] }] : []),
            ...(line ? [{ type: 'text', value: line }] : []),
          ])
      })
    }
    node.children.forEach(visit)
  }
  return visit
}
