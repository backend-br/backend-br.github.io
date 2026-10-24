/**
 * The challenges of the `desafios` repository. Its README lists every challenge as a link to the
 * `PROBLEM.md` of its folder, which states the problem, and each folder holds a `SOLUTIONS.md` whose
 * table lists the solutions the community sent, one repository per row with the language it is written
 * in. A line above the table names the first solution sent, the one the pages highlight.
 */
import { blobUrl, rawUrl } from './catalog'
import { absoluteLinks, firstUrl, headingOf, plainText, sections, tableRows } from './markdown'

export const REPOSITORY = 'desafios'

export interface ChallengeEntry {
  /** The folder of the challenge in the repository, which is also the address of its page. */
  readonly slug: string
  readonly title: string
}

export interface Problem {
  readonly title: string
  /** The first paragraph of the statement, as plain words. */
  readonly summary: string
  /** The rest of the statement, as Markdown, without the section that points to the solutions. */
  readonly body: string
}

export interface Solution {
  readonly language: string
  readonly repository: string
}

/** A solution as its card presents it: who owns the repository, what it is named, and whether it came first. */
export interface SolutionCard extends Solution {
  readonly owner: string
  readonly name: string
  readonly first: boolean
}

export interface LanguageGroup {
  readonly language: string
  readonly repositories: readonly string[]
}

/** The section of a statement that only points to `SOLUTIONS.md`, which the page lists on its own. */
const SOLUTIONS_SECTION = 'soluções'

/** Answers the challenges the README of the repository lists, in its order, each one once. */
export function challengeIndex(readme: string): ChallengeEntry[] {
  const seen = new Set<string>()
  const entries: ChallengeEntry[] = []
  for (const match of readme.matchAll(/\[([^\]]+)\]\(\.?\/?([\w-]+)\/PROBLEM\.md\)/g)) {
    const title = (match[1] ?? '').trim()
    const slug = match[2] ?? ''
    if (!seen.has(slug)) {
      seen.add(slug)
      entries.push({ slug, title })
    }
  }
  return entries
}

/** Answers the statement of a challenge, from the `PROBLEM.md` of its folder. */
export function problem(slug: string, markdown: string): Problem {
  const [intro = [], ...rest] = sections(markdown)
  const title =
    intro
      .find((line) => /^# /.test(line))
      ?.replace(/^# /, '')
      .trim() ?? slug
  const paragraphs = intro
    .filter((line) => !/^# /.test(line))
    .join('\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== '')
  const [first = '', ...more] = paragraphs
  const body = [
    more.join('\n\n'),
    ...rest.filter((part) => headingOf(part) !== SOLUTIONS_SECTION).map((part) => part.join('\n')),
  ]
    .join('\n\n')
    .trim()
  const base = { blob: blobUrl(REPOSITORY, slug), raw: rawUrl(REPOSITORY, slug) }
  return { title, summary: plainText(first), body: absoluteLinks(body, base) }
}

/** Answers the solutions the `SOLUTIONS.md` of a challenge lists, each row that names a repository. */
export function solutions(markdown: string): Solution[] {
  return tableRows(markdown.split(/\r?\n/)).flatMap(([language = '', repository = '']) => {
    const url = firstUrl(repository)
    const name = language.replace(/`/g, '').trim()
    return url !== null && name !== '' ? [{ language: name, repository: url }] : []
  })
}

/**
 * Answers the solutions grouped by language, the most solved language first.
 *
 * The rows spell a language as each author typed it, so `PHP` and `Php` are one language. The group is
 * named the way most rows spell it, and the first spelling read wins a tie.
 */
export function byLanguage(list: readonly Solution[]): LanguageGroup[] {
  const groups = new Map<string, { spellings: Map<string, number>; repositories: string[] }>()
  for (const solution of list) {
    const key = solution.language.toLowerCase()
    const group = groups.get(key) ?? { spellings: new Map<string, number>(), repositories: [] }
    group.spellings.set(solution.language, (group.spellings.get(solution.language) ?? 0) + 1)
    group.repositories.push(solution.repository)
    groups.set(key, group)
  }
  return [...groups.values()]
    .map((group) => ({
      language: [...group.spellings.entries()].reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0],
      repositories: group.repositories,
    }))
    .sort((a, b) => b.repositories.length - a.repositories.length || a.language.localeCompare(b.language, 'pt-BR'))
}

/** The words of the line of `SOLUTIONS.md` that names the first solution sent. */
const FIRST_SOLUTION = /primeira solução/i

/** Answers the repository the `SOLUTIONS.md` of a challenge names as the first solution sent, or null when it names none. */
export function firstSolution(markdown: string): string | null {
  const line = markdown.split(/\r?\n/).find((text) => !text.trim().startsWith('|') && FIRST_SOLUTION.test(text))
  return line === undefined ? null : (firstUrl(line)?.replace(/[.,;:]+$/, '') ?? null)
}

/**
 * Answers the solutions in the order the page presents them: the first one sent, then the rest grouped by
 * language, the most solved language first. A first solution the table does not list is left out.
 */
export function solutionCards(list: readonly Solution[], first: string | null): SolutionCard[] {
  const key = first?.toLowerCase()
  const cards = byLanguage(list).flatMap((group) =>
    group.repositories.map((repository) => {
      const [owner = '', name = ''] = new URL(repository).pathname.split('/').filter(Boolean)
      return {
        language: group.language,
        repository,
        owner,
        name: name || owner,
        first: repository.toLowerCase() === key,
      }
    }),
  )
  return [...cards.filter((card) => card.first), ...cards.filter((card) => !card.first)]
}
