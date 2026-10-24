/**
 * What an opening posted through the issue form of `vagas` says in its fields, and the `JobPosting` that
 * search engines read from it. The form writes each field under a `###` heading named by its label, in
 * Portuguese or in English. The title follows the form too, `[Work model] Role - Company`.
 *
 * A `JobPosting` with a wrong company or place can cost the site its listing, so one is only made when
 * every field it needs is read for certain: the company from a title with a single separator, and the
 * country from a place that names Brazil or one of its states. Any other opening is left without one.
 */
import type { Job } from './jobs'

export type Field = 'description' | 'companyUrl' | 'contract' | 'workModel' | 'location'

const LABELS: Readonly<Record<Field, readonly string[]>> = {
  description: ['descrição da vaga', 'job description'],
  companyUrl: ['site da empresa', 'company website'],
  contract: ['regime de contratação', 'contract type'],
  workModel: ['modelo de trabalho', 'work model'],
  location: ['localização', 'location'],
}

/** What GitHub writes in a field the author left empty. */
const NO_RESPONSE = '_No response_'

/** Answers the fields an opening filled in the form, empty for an opening posted without it. */
export function formFields(body: string): Partial<Record<Field, string>> {
  const fields: Partial<Record<Field, string>> = {}
  for (const part of body.split(/^###\s+/m).slice(1)) {
    const [heading = '', ...lines] = part.split(/\r?\n/)
    const field = (Object.keys(LABELS) as Field[]).find((key) => LABELS[key].includes(heading.trim().toLowerCase()))
    const value = lines.join('\n').trim()
    if (field !== undefined && value !== '' && value !== NO_RESPONSE) {
      fields[field] = value
    }
  }
  return fields
}

const REMOTE = new Set(['remoto', 'remote'])
const ON_SITE = new Set(['híbrido', 'hybrid', 'presencial', 'on-site'])

/** The kinds of contract of the form, as the `employmentType` of schema.org names them. */
const EMPLOYMENT: ReadonlyMap<string, string> = new Map([
  ['clt', 'FULL_TIME'],
  ['pj', 'CONTRACTOR'],
  ['contrato', 'CONTRACTOR'],
  ['contractor', 'CONTRACTOR'],
  ['freelance', 'CONTRACTOR'],
])

const BRAZIL = /\bbra[sz]il\b/i
const STATES = /\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/

/** Answers the role and the company a title in the shape of the form names, or null for any other title. */
export function roleAndCompany(title: string): { role: string; company: string } | null {
  const match = /^\s*\[[^\]]+\]\s*(.+)$/.exec(title)
  const parts = (match?.[1] ?? '').split(/\s+[-–—]\s+/)
  const [role = '', company = ''] = parts.map((part) => part.trim())
  if (parts.length !== 2 || role === '' || company === '' || /^(NomeDaEmpresa|CompanyName)$/i.test(company)) {
    return null
  }
  return { role, company }
}

/**
 * Answers the `JobPosting` of an opening, its description given as the HTML the page renders, or null when
 * the opening does not say for certain who hires, for what kind of work, and in which country.
 */
export function jobPosting(
  job: Pick<Job, 'number' | 'title' | 'opened' | 'body'>,
  description: string,
  url: string,
): Record<string, unknown> | null {
  const fields = formFields(job.body)
  const named = roleAndCompany(job.title)
  const model = fields.workModel?.toLowerCase()
  if (named === null || model === undefined || fields.description === undefined) {
    return null
  }
  const place = fields.location ?? ''
  const inBrazil = BRAZIL.test(place) || STATES.test(place)
  const remote = REMOTE.has(model)
  if (!inBrazil || (!remote && !ON_SITE.has(model))) {
    return null
  }
  const employment = [
    ...new Set(
      (fields.contract ?? '')
        .split(/,\s*/)
        .map((kind) => EMPLOYMENT.get(kind.trim().toLowerCase()))
        .filter((kind) => kind !== undefined),
    ),
  ]
  const website = /^https?:\/\/\S+$/.test(fields.companyUrl ?? '') ? fields.companyUrl : undefined
  return {
    '@type': 'JobPosting',
    title: named.role,
    description,
    url,
    datePosted: job.opened,
    directApply: false,
    identifier: { '@type': 'PropertyValue', name: 'backend-br/vagas', value: String(job.number) },
    hiringOrganization: { '@type': 'Organization', name: named.company, ...(website ? { sameAs: website } : {}) },
    ...(employment.length > 0 ? { employmentType: employment } : {}),
    ...(remote
      ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'Brasil' } }
      : {
          jobLocation: {
            '@type': 'Place',
            address: { '@type': 'PostalAddress', addressLocality: place, addressCountry: 'BR' },
          },
        }),
  }
}
