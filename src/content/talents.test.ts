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
    const read = talents(
      [issue(1, ['verificado']), issue(2, ['divulgar-perfil']), issue(3, [...SHARED, 'Sênior'])],
      LABELS,
    )

    expect(read.map((talent) => talent.number)).toEqual([3])
  })

  it('reads the facets from the labels and leaves the status labels out', () => {
    const [talent] = talents([issue(1, [...SHARED, 'Sênior', 'PJ', 'Remoto', 'Go', 'Stale'])], LABELS)

    expect(talent?.level).toEqual(['Sênior'])
    expect(talent?.contract).toEqual(['PJ'])
    expect(talent?.modality).toEqual(['Remoto'])
    expect(talent?.stack).toEqual(['Go'])
  })

  it('reads the form and keeps only profile links', () => {
    const [talent] = talents(
      [issue(1, SHARED, { body: body({ GitHub: 'javascript:alert(1)', Portfólio: 'https://maria.dev' }) })],
      LABELS,
    )

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

  it('puts the latest updated profiles first', () => {
    const read = talents([issue(1, SHARED), issue(3, SHARED), issue(2, SHARED)], LABELS)

    expect(read.map((talent) => talent.number)).toEqual([3, 2, 1])
  })

  it('anchors each profile by its issue number', () => {
    expect(anchor(42)).toBe('perfil-42')
  })
})
