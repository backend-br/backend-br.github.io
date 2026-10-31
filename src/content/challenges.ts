import { blobUrl, rawUrl } from './catalog'
import { absoluteLinks, firstUrl, headingOf, plainText, sections, tableRows } from './markdown'

export const REPOSITORY = 'desafios'

export interface ChallengeEntry {
  readonly slug: string
  readonly title: string
}

export interface Problem {
  readonly title: string
  readonly summary: string
  readonly body: string
}

export interface Solution {
  readonly language: string
  readonly repository: string
}

export interface SolutionCard extends Solution {
  readonly owner: string
  readonly name: string
  readonly first: boolean
}

export interface LanguageGroup {
  readonly language: string
  readonly repositories: readonly string[]
}

const SOLUTIONS_SECTION = 'soluções'

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

export function solutions(markdown: string): Solution[] {
  return tableRows(markdown.split(/\r?\n/)).flatMap(([language = '', repository = '']) => {
    const url = firstUrl(repository)
    const name = language.replace(/`/g, '').trim()
    return url !== null && name !== '' ? [{ language: name, repository: url }] : []
  })
}

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

const FIRST_SOLUTION = /primeira solução/i

export function firstSolution(markdown: string): string | null {
  const line = markdown.split(/\r?\n/).find((text) => !text.trim().startsWith('|') && FIRST_SOLUTION.test(text))
  return line === undefined ? null : (firstUrl(line)?.replace(/[.,;:]+$/, '') ?? null)
}

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
