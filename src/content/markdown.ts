const FENCE = /^\s*(```|~~~)/

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

export function headingOf(section: readonly string[]): string {
  const first = section[0] ?? ''
  return /^## /.test(first) ? first.replace(/^## /, '').trim().toLowerCase() : ''
}

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

export function links(text: string): Link[] {
  return [...text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)].map((match) => ({
    label: (match[1] ?? '').trim(),
    url: match[2] ?? '',
  }))
}

export function firstUrl(text: string): string | null {
  return /https?:\/\/[^\s)|>\]]+/.exec(text)?.[0] ?? null
}

export function plainText(markdown: string): string {
  return markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function resolve(target: string, image: boolean, base: { blob: string; raw: string }): string {
  if (/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(target)) {
    return target
  }
  const path = target.replace(/^\.?\//, '')
  return `${image ? base.raw : base.blob}/${path}`
}

export function absoluteLinks(markdown: string, base: { blob: string; raw: string }): string {
  return markdown
    .replace(/(!?)\[([^\]]*)\]\(([^)\s]+)\)/g, (_, bang: string, label: string, target: string) => {
      return `${bang}[${label}](${resolve(target, bang === '!', base)})`
    })
    .replace(/(<img[^>]*\ssrc=")([^"]+)(")/g, (_, open: string, target: string, close: string) => {
      return `${open}${resolve(target, true, base)}${close}`
    })
}

export const SHIKI = {
  themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
  defaultColor: false,
} as const

interface HtmlNode {
  type: string
  value?: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HtmlNode[]
}

const SAFE_URL = /^(https?:|mailto:|#)/i

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

const PROSE = new Set(['p', 'li', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'strong', 'em', 'del'])

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
