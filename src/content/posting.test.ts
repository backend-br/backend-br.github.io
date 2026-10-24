import { describe, expect, it } from 'vitest'
import type { Job } from './jobs'
import { formFields, jobPosting, roleAndCompany } from './posting'

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
    const fields = formFields(FORM)
    expect(fields.description).toBe('Manter a API.')
    expect(fields.workModel).toBe('Remoto')
    expect(fields).not.toHaveProperty('salary')
    expect(formFields('## Requisitos\n\nNode')).toEqual({})
  })

  it('reads the role and the company only from a title with a single separator', () => {
    expect(roleAndCompany('[Remoto] Dev Java Pleno - DB1/ANYMARKET')).toEqual({
      role: 'Dev Java Pleno',
      company: 'DB1/ANYMARKET',
    })
    expect(roleAndCompany('[Híbrido] Dev - Programa - Rio de Janeiro - RJ')).toBeNull()
    expect(roleAndCompany('Dev Java - Empresa')).toBeNull()
    expect(roleAndCompany('[Remoto] Desenvolvedor(a) Back-end Pleno - NomeDaEmpresa')).toBeNull()
  })
})

describe('the JobPosting of an opening', () => {
  it('describes a remote opening open to Brazil, with its company and kinds of contract', () => {
    const posting = jobPosting(
      job('[Remoto] Dev Backend - Empresa', FORM),
      '<p>Manter a API.</p>',
      'https://x/vagas/7/',
    )
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
    const body = FORM.replace('Remoto', 'Presencial').replace(/Brasil$/, 'Curitiba - PR')
    expect(jobPosting(job('[Presencial] Dev - Empresa', body), '', '')).toMatchObject({
      jobLocation: { address: { addressLocality: 'Curitiba - PR', addressCountry: 'BR' } },
    })
  })

  it('makes none when the country, the company or the form is not certain', () => {
    expect(jobPosting(job('[Remoto] Dev - Empresa', FORM.replace(/Brasil$/, 'Remoto')), '', '')).toBeNull()
    expect(jobPosting(job('[Remoto] Dev', FORM), '', '')).toBeNull()
    expect(jobPosting(job('[Remoto] Dev - Empresa', '## Sobre\n\nTexto'), '', '')).toBeNull()
  })
})
