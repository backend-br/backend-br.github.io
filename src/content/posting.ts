import type { Job } from './jobs'
import { plainText } from './markdown'

export type Field = 'description' | 'companyUrl' | 'salary' | 'contract' | 'workModel' | 'location' | 'validThrough'

const LABELS: Readonly<Record<Field, readonly string[]>> = {
  description: ['descrição da vaga', 'job description'],
  companyUrl: ['site da empresa', 'company website'],
  salary: ['faixa salarial', 'salary range'],
  contract: ['regime de contratação', 'contract type'],
  workModel: ['modelo de trabalho', 'work model'],
  location: ['localização', 'location'],
  validThrough: ['válida até', 'valid until'],
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

/** Drops every HTML comment and tag in one scan, so no angle bracket, and so no rebuilt tag, survives. */
function withoutMarkup(text: string): string {
  let plain = ''
  let index = 0
  while (index < text.length) {
    const character = text[index] ?? ''
    if (character === '>') {
      index++
    } else if (character !== '<') {
      plain += character
      index++
    } else if (text.startsWith('<!--', index)) {
      const close = text.indexOf('-->', index + 4)
      index = close === -1 ? text.length : close + 3
    } else {
      const close = text.indexOf('>', index + 1)
      index = close === -1 ? index + 1 : close + 1
    }
  }
  return plain
}

export function jobSummary(body: string): string {
  return plainText(withoutMarkup((formFields(body).description ?? body).replace(/^\s*(#+|>+|[-*_]{3,})\s*/gm, '')))
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

const CURRENCIES: readonly (readonly [RegExp, string])[] = [
  [/R\$|\bBRL\b|\breais\b/i, 'BRL'],
  [/US\$|\bUSD\b|\bd[oó]lar(es)?\b|\bdollars?\b|(^|[^A-Z])\$/i, 'USD'],
  [/€|\bEUR\b|\beuros?\b/i, 'EUR'],
]

const UNITS: readonly (readonly [RegExp, string])[] = [
  [/\b(por hora|hourly|per hour)\b|\/\s*(h|hora|hour|hr)\b/i, 'HOUR'],
  [/\b(ano|anual|year|yearly|annual|annually)\b/i, 'YEAR'],
]

const AMOUNT = /(\d[\d.,]*)\s*(k|mil)?\b/gi

/** Reads 8.000, 8.000,00, 4,000, 4,000.00, 7,5, 8k and 8 mil alike. */
function amount(digits: string, thousands: string | undefined): number {
  const last = Math.max(digits.lastIndexOf(','), digits.lastIndexOf('.'))
  const separators = new Set(digits.replace(/\d/g, ''))
  const grouped = separators.size === 1 && /^\d{1,3}([.,]\d{3})+$/.test(digits)
  const decimal = last !== -1 && !grouped
  const whole = (decimal ? digits.slice(0, last) : digits).replace(/[.,]/g, '')
  const value = Number(decimal ? `${whole}.${digits.slice(last + 1)}` : whole)
  return thousands === undefined ? value : value * 1000
}

export function baseSalary(text: string): Record<string, unknown> | null {
  const currency = CURRENCIES.find(([pattern]) => pattern.test(text))?.[1]
  const amounts = [...text.matchAll(AMOUNT)]
    .map((match) => amount(match[1] ?? '', match[2]))
    .filter((value) => Number.isFinite(value) && value > 0)
  if (currency === undefined || amounts.length === 0 || amounts.length > 2) {
    return null
  }
  const [low = 0, high = low] = amounts
  if (high < low) {
    return null
  }
  const unitText = UNITS.find(([pattern]) => pattern.test(text))?.[1] ?? 'MONTH'
  return {
    '@type': 'MonetaryAmount',
    currency,
    value: {
      '@type': 'QuantitativeValue',
      ...(low === high ? { value: low } : { minValue: low, maxValue: high }),
      unitText,
    },
  }
}

/** Reads the last day to apply, written as 2026-12-31 or 31/12/2026, as a calendar date. */
export function lastDay(text: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim())
  const local = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim())
  const [year, month, day] = iso ? [iso[1], iso[2], iso[3]] : local ? [local[3], local[2], local[1]] : []
  if (year === undefined || month === undefined || day === undefined) {
    return null
  }
  const date = `${year}-${month}-${day}`
  const parsed = new Date(`${date}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date ? null : date
}

/** Splits "Curitiba - PR" or "Curitiba/PR" into the city and its state. */
export function cityAndState(place: string): { city: string; state?: string } {
  const state = STATES.exec(place)?.[1]
  if (state === undefined) {
    return { city: place }
  }
  const city = place
    .replace(new RegExp(`\\s*[-–—/,]?\\s*\\b${state}\\b\\s*`), ' ')
    .replace(/\s*[-–—/,]?\s*\bbra[sz]il\b\s*/i, ' ')
    .trim()
  return { city: city === '' ? place : city, state }
}

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
  const salary = fields.salary === undefined ? null : baseSalary(fields.salary)
  const { city, state } = cityAndState(place)
  const deadline = fields.validThrough === undefined ? null : lastDay(fields.validThrough)
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
    ...(salary === null ? {} : { baseSalary: salary }),
    ...(deadline === null ? {} : { validThrough: deadline }),
    ...(remote
      ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'Brasil' } }
      : {
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressLocality: city,
              ...(state === undefined ? {} : { addressRegion: state }),
              addressCountry: 'BR',
            },
          },
        }),
  }
}
