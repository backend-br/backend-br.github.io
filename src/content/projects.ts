/**
 * The Brazilian open-source projects the `opensource-br` repository lists. Its README registers each
 * project as a row of the table under `## Projetos`: the name linking to the source code, the language,
 * and any other links, such as documentation or a site.
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

export interface ProjectGroup {
  readonly language: string
  readonly projects: readonly Project[]
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
export function byLanguage(list: readonly Project[]): ProjectGroup[] {
  const groups = new Map<string, Project[]>()
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
