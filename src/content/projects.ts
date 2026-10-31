import { firstUrl, headingOf, type Link, links, sections, tableRows } from './markdown'

export const REPOSITORY = 'opensource-br'

const PROJECTS_SECTION = 'projetos'

export interface Project {
  readonly name: string
  readonly url: string
  readonly source: string
  readonly language: string
  readonly links: readonly Link[]
}

function sourceOf(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '')
}

export function projects(readme: string): Project[] {
  const section = sections(readme).find((part) => headingOf(part) === PROJECTS_SECTION) ?? []
  return tableRows(section).flatMap(([name = '', language = '', others = '']) => {
    const [link] = links(name)
    const url = link?.url ?? firstUrl(name)
    if (url === null) {
      return []
    }
    return [{ name: link?.label ?? url, url, source: sourceOf(url), language: language.trim(), links: links(others) }]
  })
}

export function byLanguage<T extends Pick<Project, 'language'>>(
  list: readonly T[],
): { readonly language: string; readonly projects: readonly T[] }[] {
  const groups = new Map<string, T[]>()
  for (const project of list) {
    groups.set(project.language, [...(groups.get(project.language) ?? []), project])
  }
  return [...groups.entries()].map(([language, grouped]) => ({ language, projects: grouped }))
}

export function languageAnchor(language: string): string {
  const slug = language
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/#/g, '-sharp')
    .replace(/\+/g, '-plus')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `linguagem-${slug}`
}

export type GitHubHome =
  | { readonly kind: 'repository'; readonly owner: string; readonly name: string }
  | { readonly kind: 'account'; readonly owner: string }

export function githubHome(url: string): GitHubHome | null {
  const match = /^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)(?:\/([\w.-]+))?\/?$/i.exec(url.trim())
  const [, owner, name] = match ?? []
  if (owner === undefined) {
    return null
  }
  return name === undefined
    ? { kind: 'account', owner }
    : { kind: 'repository', owner, name: name.replace(/\.git$/, '') }
}

export function byStars<T extends Project>(
  list: readonly { project: T; stars: number | null }[],
): (T & { stars: number })[] {
  return list
    .flatMap(({ project, stars }, index) => (stars === null ? [] : [{ ...project, stars, index }]))
    .sort((a, b) => b.stars - a.stars || a.index - b.index)
    .map(({ index: _, ...project }) => project as T & { stars: number })
}
