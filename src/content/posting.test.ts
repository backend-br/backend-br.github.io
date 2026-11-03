import { describe, expect, it } from 'vitest'
import type { Job } from './jobs'
import { formFields, jobPosting, jobSummary, roleAndCompany } from './posting'

const FORM = [
  '### Sobre a empresa',
  '',
  'Uma empresa.',
  '',
  '### Site da empresa',
  '',
  'https://empresa.com.br',
  '',
  '### Descrição da vaga',
  '',
  'Manter a API.',
  '',
  '### Faixa salarial',
  '',
  '_No response_',
  '',
  '### Regime de contratação',
  '',
  'CLT, PJ, Contrato',
  '',
  '### Modelo de trabalho',
  '',
  'Remoto',
  '',
  '### Localização',
  '',
  'Brasil',
].join('\n')

function job(title: string, body: string): Job {
  return {
    number: 7,
    title,
    url: 'https://github.com/backend-br/vagas/issues/7',
    opened: '2026-10-20T12:00:00Z',
    open: true,
    modality: [],
    level: [],
    contract: [],
    stack: [],
    author: 'ana',
    avatar: '',
    body,
  }
}

describe('the fields of the form', () => {
  it('reads each field by its label and leaves out the ones the author left empty', () => {
    // Given a form with one field left empty
    const form = FORM

    // When the fields are read
    const fields = formFields(form)

    // Then each filled field is read by its label and the empty one is left out
    expect(fields.description).toBe('Manter a API.')
    expect(fields.workModel).toBe('Remoto')
    expect(fields).not.toHaveProperty('salary')
  })

  it('reads no field from a text that is not the form', () => {
    // Given a text without the form
    const text = '## Requisitos\n\nNode'

    // When the fields are read
    const fields = formFields(text)

    // Then there are none
    expect(fields).toEqual({})
  })

  it('reads the role and the company only from a title with a single separator', () => {
    // Given a title with a single separator
    const title = '[Remoto] Dev Java Pleno - DB1/ANYMARKET'

    // When the role and the company are read
    const read = roleAndCompany(title)

    // Then both are read
    expect(read).toEqual({
      role: 'Dev Java Pleno',
      company: 'DB1/ANYMARKET',
    })
  })

  it.each([
    ['[Híbrido] Dev - Programa - Rio de Janeiro - RJ'],
    ['Dev Java - Empresa'],
    ['[Remoto] Desenvolvedor(a) Back-end Pleno - NomeDaEmpresa'],
  ])('reads neither the role nor the company from the title %j', (title) => {
    // Given a title that is not a single-separator title
    const text = title

    // When the role and the company are read
    const read = roleAndCompany(text)

    // Then neither is read
    expect(read).toBeNull()
  })
})

describe('the summary of an opening', () => {
  it('reads the description of the form as plain text', () => {
    // Given a form whose description has a comment, a heading and links
    const body =
      '### Descrição da vaga\n\n<!-- dica -->\n## Sobre\n**Backend** em [Go](https://go.dev).\n\n### Localização\n\nRecife'

    // When the summary is read
    const summary = jobSummary(body)

    // Then it is the description as plain text
    expect(summary).toBe('Sobre Backend em Go.')
  })

  it('falls back to the whole text when there is no form', () => {
    // Given a text with markup and no form
    const body = 'Vaga <b>Java</b> remota.'

    // When the summary is read
    const summary = jobSummary(body)

    // Then it is the whole text as plain text
    expect(summary).toBe('Vaga Java remota.')
  })

  it('leaves no tag behind when markup is nested to rebuild one', () => {
    // Given a text whose tags and comments rebuild a tag once the inner ones are taken out
    const body = 'Vaga <scr<b>ipt>alert(1)</script> e <!<!-- x -->-- y --> remota.'

    // When the summary is read
    const summary = jobSummary(body)

    // Then no angle bracket survives
    expect(summary).not.toMatch(/[<>]/)
    expect(summary).toBe('Vaga iptalert(1) e -- y -- remota.')
  })
})

describe('the JobPosting of an opening', () => {
  it('describes a remote opening open to Brazil, with its company and kinds of contract', () => {
    // Given a remote opening with the full form
    const opening = job('[Remoto] Dev Backend - Empresa', FORM)

    // When the posting is made
    const posting = jobPosting(opening, '<p>Manter a API.</p>', 'https://x/vagas/7/')

    // Then it describes the remote opening, its company and contracts
    expect(posting).toMatchObject({
      '@type': 'JobPosting',
      title: 'Dev Backend',
      datePosted: '2026-10-20T12:00:00Z',
      hiringOrganization: { name: 'Empresa', sameAs: 'https://empresa.com.br' },
      employmentType: ['FULL_TIME', 'CONTRACTOR'],
      jobLocationType: 'TELECOMMUTE',
      applicantLocationRequirements: { '@type': 'Country', name: 'Brasil' },
    })
  })

  it('places an on-site opening in the city its location names', () => {
    // Given an on-site opening located in Curitiba
    const body = FORM.replace('Remoto', 'Presencial').replace(/Brasil$/, 'Curitiba - PR')
    const opening = job('[Presencial] Dev - Empresa', body)

    // When the posting is made
    const posting = jobPosting(opening, '', '')

    // Then it is placed in that city
    expect(posting).toMatchObject({
      jobLocation: { address: { addressLocality: 'Curitiba - PR', addressCountry: 'BR' } },
    })
  })

  it.each([
    ['the country', '[Remoto] Dev - Empresa', FORM.replace(/Brasil$/, 'Remoto')],
    ['the company', '[Remoto] Dev', FORM],
    ['the form', '[Remoto] Dev - Empresa', '## Sobre\n\nTexto'],
  ])('makes none when %s is not certain', (_uncertain, title, body) => {
    // Given an opening whose country, company or form is not certain
    const opening = job(title, body)

    // When the posting is made
    const posting = jobPosting(opening, '', '')

    // Then there is none
    expect(posting).toBeNull()
  })
})
