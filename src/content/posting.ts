import type { Job } from './jobs'

export type Field = 'description' | 'companyUrl' | 'contract' | 'workModel' | 'location'

const LABELS: Readonly<Record<Field, readonly string[]>> = {
  description: ['descrição da vaga', 'job description'],
  companyUrl: ['site da empresa', 'company website'],
  contract: ['regime de contratação', 'contract type'],
  workModel: ['modelo de trabalho', 'work model'],
  location: ['localização', 'location'],
}

const NO_RESPONSE = '_No response_'

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

const EMPLOYMENT: ReadonlyMap<string, string> = new Map([
  ['clt', 'FULL_TIME'],
  ['pj', 'CONTRACTOR'],
  ['contrato', 'CONTRACTOR'],
  ['contractor', 'CONTRACTOR'],
  ['freelance', 'CONTRACTOR'],
])

const BRAZIL = /\bbra[sz]il\b/i
const STATES = /\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/

export function roleAndCompany(title: string): { role: string; company: string } | null {
  const match = /^\s*\[[^\]]+\]\s*(.+)$/.exec(title)
  const parts = (match?.[1] ?? '').split(/\s+[-–—]\s+/)
  const [role = '', company = ''] = parts.map((part) => part.trim())
  if (parts.length !== 2 || role === '' || company === '' || /^(NomeDaEmpresa|CompanyName)$/i.test(company)) {
    return null
  }
  return { role, company }
}

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
