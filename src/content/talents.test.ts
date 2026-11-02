import { describe, expect, it } from 'vitest'
import type { Issue, Label } from './jobs'
import { anchor, talents } from './talents'

const LABELS: readonly Label[] = [
  { name: 'Remoto', description: 'Tipo de alocação.' },
  { name: 'Sênior', description: 'Nível de experiência.' },
  { name: 'PJ', description: 'Tipo de contratação.' },
  { name: 'Go', description: 'Linguagem de programação.' },
  { name: 'Stale', description: '[USO INTERNO] Candidatura que serão fechadas.' },
  { name: 'verificado', description: null },
]

function body(fields: Record<string, string>): string {
  return Object.entries({
    'Nome completo': 'Maria Silva',
    Cargo: 'Desenvolvedora Back-end',
    Apresentação: 'Seis anos com APIs.',
    Localização: 'Belo Horizonte - MG',
    LinkedIn: 'https://www.linkedin.com/in/maria',
    GitHub: 'https://github.com/maria',
    Portfólio: '_No response_',
    ...fields,
  })
    .map(([heading, value]) => `### ${heading}\n\n${value}`)
    .join('\n\n')
}

function issue(number: number, labels: readonly string[], extra: Partial<Issue> = {}): Issue {
  return {
    number,
    title: 'Maria Silva - Back-end',
    html_url: `https://github.com/backend-br/me-contrata/issues/${number}`,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: `2026-11-0${number}T00:00:00Z`,
    locked: false,
    labels: labels.map((name) => ({ name })),
    user: { login: 'maria', avatar_url: '' },
    body: body({}),
    ...extra,
  }
}

const SHARED = ['verificado', 'divulgar-perfil']

describe('the shared talents', () => {
  it('lists only verified profiles that opted in', () => {
    // Given a verified profile, an opted-in profile and one that is both
    const issues = [issue(1, ['verificado']), issue(2, ['divulgar-perfil']), issue(3, [...SHARED, 'Sênior'])]

    // When the talents are read
    const read = talents(issues, LABELS)

    // Then only the one that is both is listed
    expect(read.map((talent) => talent.number)).toEqual([3])
  })

  it('leaves out a closed profile even with consent', () => {
    // Given a closed profile that kept both consent labels
    const issues = [issue(1, SHARED, { state: 'closed' })]

    // When the talents are read
    const read = talents(issues, LABELS)

    // Then no profile is listed
    expect(read).toEqual([])
  })

  it('leaves out a profile the triage refused', () => {
    // Given a profile with both consent labels and the refused label
    const issues = [issue(1, [...SHARED, 'triagem-recusada'])]

    // When the talents are read
    const read = talents(issues, LABELS)

    // Then no profile is listed
    expect(read).toEqual([])
  })

  it('reads the facets from the labels and leaves the status labels out', () => {
    // Given a profile with a label of each facet and a status label
    const issues = [issue(1, [...SHARED, 'Sênior', 'PJ', 'Remoto', 'Go', 'Stale'])]

    // When the talents are read
    const [talent] = talents(issues, LABELS)

    // Then each facet has its label and the status labels are left out
    expect(talent?.level).toEqual(['Sênior'])
    expect(talent?.contract).toEqual(['PJ'])
    expect(talent?.modality).toEqual(['Remoto'])
    expect(talent?.stack).toEqual(['Go'])
  })

  it('reads the form and keeps only profile links', () => {
    // Given a profile whose GitHub field runs code and whose portfolio is a link
    const issues = [issue(1, SHARED, { body: body({ GitHub: 'javascript:alert(1)', Portfólio: 'https://maria.dev' }) })]

    // When the talents are read
    const [talent] = talents(issues, LABELS)

    // Then the form is read and the link that runs code is dropped
    expect(talent).toMatchObject({
      name: 'Maria Silva',
      role: 'Desenvolvedora Back-end',
      location: 'Belo Horizonte - MG',
      linkedin: 'https://www.linkedin.com/in/maria',
      github: null,
      portfolio: 'https://maria.dev',
      url: 'https://github.com/backend-br/me-contrata/issues/1',
    })
  })

  it('reads the GitHub login from the GitHub field', () => {
    // Given a profile whose GitHub field names an account
    const issues = [issue(1, SHARED, { body: body({ GitHub: 'https://github.com/maria-dev' }) })]

    // When the talents are read
    const [talent] = talents(issues, LABELS)

    // Then the login comes from the GitHub field
    expect(talent?.login).toBe('maria-dev')
  })

  it('falls back to the author of the issue when there is no GitHub field', () => {
    // Given a profile without a GitHub field
    const issues = [issue(1, SHARED, { body: body({ GitHub: '_No response_' }) })]

    // When the talents are read
    const [talent] = talents(issues, LABELS)

    // Then the login is the author of the issue
    expect(talent?.login).toBe('maria')
  })

  it('puts the latest updated profiles first', () => {
    // Given three profiles updated on different days
    const issues = [issue(1, SHARED), issue(3, SHARED), issue(2, SHARED)]

    // When the talents are read
    const read = talents(issues, LABELS)

    // Then the latest updated comes first
    expect(read.map((talent) => talent.number)).toEqual([3, 2, 1])
  })

  it('anchors each profile by its issue number', () => {
    // Given the number of an issue
    const number = 42

    // When its anchor is made
    const made = anchor(number)

    // Then it is the profile anchor of that number
    expect(made).toBe('perfil-42')
  })
})
