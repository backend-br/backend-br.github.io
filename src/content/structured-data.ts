import { LOCALE, SITE, TEXT } from './site'

export type Node = Record<string, unknown>

export function organizationId(origin: string | URL): string {
  return new URL('/#organization', origin).href
}

export function websiteId(origin: string | URL): string {
  return new URL('/#website', origin).href
}

export function breadcrumbs(
  origin: string | URL,
  trail: readonly { readonly name: string; readonly path: string }[],
): Node {
  const steps = [{ name: TEXT.nav.home, path: '/' }, ...trail]
  return {
    '@type': 'BreadcrumbList',
    itemListElement: steps.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: new URL(step.path, origin).href,
    })),
  }
}

export interface ListEntry {
  readonly name: string
  readonly url: string
  readonly item?: Node
}

export function itemList(entries: readonly ListEntry[], name?: string): Node {
  return {
    '@type': 'ItemList',
    ...(name ? { name } : {}),
    numberOfItems: entries.length,
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      ...(entry.item ? { item: entry.item } : { name: entry.name, url: entry.url }),
    })),
  }
}

export function sourceCode(code: {
  readonly name: string
  readonly url: string
  readonly language: string
  readonly owner?: string
  readonly description?: string
}): Node {
  return {
    '@type': 'SoftwareSourceCode',
    name: code.name,
    url: code.url,
    codeRepository: code.url,
    ...(code.language ? { programmingLanguage: code.language } : {}),
    ...(code.description ? { description: code.description } : {}),
    ...(code.owner
      ? { author: { '@type': 'Person', name: code.owner, url: `https://github.com/${encodeURIComponent(code.owner)}` } }
      : {}),
  }
}

export function collection(
  origin: string | URL,
  page: { readonly path: string; readonly name: string; readonly description: string },
  items: readonly ListEntry[],
): Node {
  return {
    '@type': 'CollectionPage',
    name: page.name,
    description: page.description,
    url: new URL(page.path, origin).href,
    inLanguage: LOCALE,
    isPartOf: { '@id': websiteId(origin) },
    mainEntity: itemList(items),
  }
}

export function identity(origin: string | URL, logo: string): Node[] {
  return [
    {
      '@type': 'Organization',
      '@id': organizationId(origin),
      name: SITE.name,
      url: new URL('/', origin).href,
      logo,
      sameAs: [SITE.github],
    },
    {
      '@type': 'WebSite',
      '@id': websiteId(origin),
      name: SITE.name,
      description: SITE.meta.description,
      url: new URL('/', origin).href,
      inLanguage: LOCALE,
      publisher: { '@id': organizationId(origin) },
    },
  ]
}
