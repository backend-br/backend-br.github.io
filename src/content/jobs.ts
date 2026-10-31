export const REPOSITORY = 'vagas'

export interface Issue {
  readonly number: number
  readonly title: string
  readonly html_url: string
  readonly created_at: string
  readonly updated_at?: string
  readonly locked: boolean
  readonly pull_request?: unknown
  readonly labels: readonly { readonly name: string }[]
  readonly user: { readonly login: string; readonly avatar_url: string } | null
  readonly body: string | null
}

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
  readonly author: string
  readonly avatar: string
  readonly body: string
}

const FACETS: ReadonlyMap<string, Facet> = new Map([
  ['tipo de alocação.', 'modality'],
  ['nível de experiência.', 'level'],
  ['tipo de contratação.', 'contract'],
])

const INTERNAL = /^\[uso interno\]/i

const TRIAGE: ReadonlySet<string> = new Set([
  'verificada',
  'em-triagem',
  'triagem-recusada',
  'revisada',
  'link-quebrado',
  'formato-sugerido',
  'aplicar-formato',
])

const REJECTED = 'triagem-recusada'

export function facetOf(description: string | null): Facet | null {
  const key = (description ?? '').trim().toLowerCase()
  if (INTERNAL.test(key)) {
    return null
  }
  return FACETS.get(key) ?? 'stack'
}

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
        author: issue.user?.login ?? '',
        avatar: issue.user?.avatar_url ?? '',
        body: (issue.body ?? '').trim(),
      }
    })
    .sort((a, b) => b.opened.localeCompare(a.opened))
}
