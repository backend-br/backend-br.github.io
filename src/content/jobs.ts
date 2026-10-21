/**
 * The job openings of the `vagas` repository. Every opening is an open issue, and the moderation tags it
 * with labels whose description says what kind of label it is: the level of experience, the kind of
 * contract, where the work happens, or the stack.
 */

export const REPOSITORY = 'vagas'

/** An issue as the GitHub REST API answers it, reduced to what an opening needs. */
export interface Issue {
  readonly number: number
  readonly title: string
  readonly html_url: string
  /** When the issue was opened, as an ISO 8601 instant. */
  readonly created_at: string
  /** Locked by the moderation, which is how the rules of the repository are pinned among the openings. */
  readonly locked: boolean
  /** Present only on a pull request, which the API lists among the issues. */
  readonly pull_request?: unknown
  readonly labels: readonly { readonly name: string }[]
}

/** A label of the repository as the GitHub REST API answers it. */
export interface Label {
  readonly name: string
  readonly description: string | null
}

export type Facet = 'modality' | 'level' | 'contract' | 'stack'

export interface Job {
  readonly number: number
  readonly title: string
  readonly url: string
  readonly opened: string
  readonly modality: readonly string[]
  readonly level: readonly string[]
  readonly contract: readonly string[]
  readonly stack: readonly string[]
}

/** The description the repository gives each kind of label, and the facet of an opening it fills. */
const FACETS: ReadonlyMap<string, Facet> = new Map([
  ['tipo de alocação.', 'modality'],
  ['nível de experiência.', 'level'],
  ['tipo de contratação.', 'contract'],
])

/** The mark the repository puts on a label that only the moderation reads, such as the one on stale openings. */
const INTERNAL = /^\[uso interno\]/i

/**
 * The labels the triage of the repository puts on an opening, which say where it stands in the moderation
 * and nothing about the opening itself. They come without a description, so they are known by name.
 */
const TRIAGE: ReadonlySet<string> = new Set(['verificada', 'em-triagem', 'triagem-recusada', 'revisada'])

/** The label of an opening the triage refused, which the site does not list. */
const REJECTED = 'triagem-recusada'

/**
 * Answers the facet a label fills, from its description, or null for a label only the moderation reads.
 * A label the repository does not describe is a technology, which is what most labels are.
 */
export function facetOf(description: string | null): Facet | null {
  const key = (description ?? '').trim().toLowerCase()
  if (INTERNAL.test(key)) {
    return null
  }
  return FACETS.get(key) ?? 'stack'
}

/**
 * Answers the openings among the open issues, the newest first, each label under its facet. An opening the
 * triage refused is left out, and the labels of the triage are hidden.
 */
export function openings(issues: readonly Issue[], labels: readonly Label[]): Job[] {
  const facets = new Map<string, Facet | null>(labels.map((label) => [label.name, facetOf(label.description)]))
  for (const name of TRIAGE) {
    facets.set(name, null)
  }
  return issues
    .filter((issue) => issue.pull_request === undefined && !issue.locked)
    .filter((issue) => !issue.labels.some((label) => label.name === REJECTED))
    .map((issue) => {
      const names = (facet: Facet): string[] =>
        issue.labels
          .map((label) => label.name)
          .filter((name) => (facets.has(name) ? facets.get(name) : 'stack') === facet)
      return {
        number: issue.number,
        title: issue.title.trim(),
        url: issue.html_url,
        opened: issue.created_at,
        modality: names('modality'),
        level: names('level'),
        contract: names('contract'),
        stack: names('stack'),
      }
    })
    .sort((a, b) => b.opened.localeCompare(a.opened))
}
