import { avatarOf, repositoryUrl } from './catalog'
import { type Facet, facetOf, type Issue, type Label } from './jobs'

export const REPOSITORY = 'me-contrata'

export const SHARED: readonly string[] = ['verificado', 'divulgar-perfil']

const STATUS: ReadonlySet<string> = new Set([
  'verificado',
  'em-triagem',
  'triagem-recusada',
  'revisado',
  'divulgar-perfil',
])

const HEADINGS = {
  name: 'Nome completo',
  role: 'Cargo',
  about: 'Apresentação',
  location: 'Localização',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  portfolio: 'Portfólio',
} as const

const LINKEDIN = /^https:\/\/(www\.)?linkedin\.com\/in\/[\w%-]+\/?$/i

const GITHUB = /^https:\/\/github\.com\/([a-z\d](?:[a-z\d-]{0,38}))\/?$/i

const PORTFOLIO = /^https:\/\/[^\s<>"']+$/i

export interface Talent {
  readonly number: number
  readonly name: string
  readonly role: string
  readonly about: string
  readonly location: string
  readonly url: string
  readonly updated: string
  readonly modality: readonly string[]
  readonly level: readonly string[]
  readonly contract: readonly string[]
  readonly stack: readonly string[]
  readonly linkedin: string | null
  readonly github: string | null
  readonly portfolio: string | null
  readonly avatar: string
}

export function sections(body: string): Record<string, string> {
  const found: Record<string, string> = {}
  for (const section of body
    .replace(/\r\n/g, '\n')
    .split(/^###\s+/m)
    .slice(1)) {
    const end = section.indexOf('\n')
    const heading = (end === -1 ? section : section.slice(0, end)).trim()
    const value = end === -1 ? '' : section.slice(end + 1).trim()
    found[heading] = value === '_No response_' ? '' : value
  }
  return found
}

function link(value: string | undefined, pattern: RegExp): string | null {
  const trimmed = (value ?? '').trim()
  return pattern.test(trimmed) ? trimmed : null
}

export function talents(issues: readonly Issue[], labels: readonly Label[]): Talent[] {
  const facets = new Map<string, Facet | null>(labels.map((label) => [label.name, facetOf(label.description)]))
  for (const name of STATUS) {
    facets.set(name, null)
  }
  return issues
    .filter((issue) => issue.pull_request === undefined && !issue.locked)
    .filter((issue) => SHARED.every((name) => issue.labels.some((label) => label.name === name)))
    .map((issue) => {
      const fields = sections(issue.body ?? '')
      const names = (facet: Facet): string[] =>
        issue.labels.map((label) => label.name).filter((name) => (facets.has(name) ? facets.get(name) : null) === facet)
      const github = link(fields[HEADINGS.github], GITHUB)
      return {
        number: issue.number,
        name: (fields[HEADINGS.name] ?? '').trim() || issue.title.trim(),
        role: (fields[HEADINGS.role] ?? '').trim(),
        about: (fields[HEADINGS.about] ?? '').trim(),
        location: (fields[HEADINGS.location] ?? '').trim(),
        url: `${repositoryUrl(REPOSITORY)}/issues/${issue.number}`,
        updated: issue.updated_at ?? issue.created_at,
        modality: names('modality'),
        level: names('level'),
        contract: names('contract'),
        stack: names('stack'),
        linkedin: link(fields[HEADINGS.linkedin], LINKEDIN),
        github,
        portfolio: link(fields[HEADINGS.portfolio], PORTFOLIO),
        avatar: avatarOf(github ? (GITHUB.exec(github)?.[1] ?? '') : (issue.user?.login ?? '')),
      }
    })
    .sort((a, b) => b.updated.localeCompare(a.updated) || a.number - b.number)
}

export function anchor(number: number): string {
  return `perfil-${number}`
}
