/**
 * The Brazilian open-source projects the `opensource-br` repository lists. Its README registers each
 * project as a row of the table under `## Projetos`: the name linking to the source code, the language,
 * and any other links, such as documentation or a site.
 *
 * The site presents only the projects that live on GitHub, ranked by their stars: a repository by its
 * own, and a project linked to a whole account by the stars of every public repository the account has.
 */
import { firstUrl, headingOf, type Link, links, sections, tableRows } from './markdown'

export const REPOSITORY = 'opensource-br'

/** The section of the README that holds the table of projects. */
const PROJECTS_SECTION = 'projetos'

export interface Project {
  readonly name: string
  readonly url: string
  /** Where the source code lives, as `owner/name` on GitHub, or the address itself elsewhere. */
  readonly source: string
  readonly language: string
  readonly links: readonly Link[]
}

function sourceOf(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '')
}

/** Answers the projects of the README, in the order of its table, each row that links to its source. */
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

/** Answers the projects grouped by language, in the order each language first appears in the table. */
export function byLanguage<T extends Pick<Project, 'language'>>(
  list: readonly T[],
): { readonly language: string; readonly projects: readonly T[] }[] {
  const groups = new Map<string, T[]>()
  for (const project of list) {
    groups.set(project.language, [...(groups.get(project.language) ?? []), project])
  }
  return [...groups.entries()].map(([language, grouped]) => ({ language, projects: grouped }))
}

/** Answers the anchor of a language on the page of projects, such as `linguagem-c-sharp` for C#. */
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

/** Where a project lives on GitHub: one repository, or an account whose public repositories make it up. */
export type GitHubHome =
  | { readonly kind: 'repository'; readonly owner: string; readonly name: string }
  | { readonly kind: 'account'; readonly owner: string }

/** Answers where on GitHub an address points, or null for an address outside it or deeper than a repository. */
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

/**
 * Answers the projects that live on GitHub, the most starred first and the order of the table between
 * equals. A project whose stars are unknown, since GitHub has nothing at its address, is left out.
 */
export function byStars<T extends Project>(
  list: readonly { project: T; stars: number | null }[],
): (T & { stars: number })[] {
  return list
    .flatMap(({ project, stars }, index) => (stars === null ? [] : [{ ...project, stars, index }]))
    .sort((a, b) => b.stars - a.stars || a.index - b.index)
    .map(({ index: _, ...project }) => project as T & { stars: number })
}
