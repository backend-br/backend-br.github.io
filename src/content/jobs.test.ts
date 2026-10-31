import { describe, expect, it } from 'vitest'
import { facetOf, type Issue, type Label, openings } from './jobs'

const LABELS: readonly Label[] = [
  { name: 'Remoto', description: 'Tipo de alocação.' },
  { name: 'Sênior', description: 'Nível de experiência.' },
  { name: 'PJ', description: 'Tipo de contratação.' },
  { name: 'Python', description: 'Linguagem de programação.' },
  { name: 'Stale', description: '[USO INTERNO] Vagas que serão fechadas.' },
]

function issue(number: number, created: string, labels: readonly string[], extra: Partial<Issue> = {}): Issue {
  return {
    number,
    title: ` [Remoto] Vaga ${number} `,
    html_url: `https://github.com/backend-br/vagas/issues/${number}`,
    created_at: created,
    locked: false,
    labels: labels.map((name) => ({ name })),
    user: { login: 'recrutadora', avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4' },
    body: '\n### Descrição da vaga\n\nBackend em Python.\n',
    ...extra,
  }
}

describe('the facet of a label', () => {
  it.each([
    ['Tipo de alocação.', 'modality'],
    ['Nível de experiência.', 'level'],
    ['tipo de contratação.', 'contract'],
    ['Banco de dados.', 'stack'],
    [null, 'stack'],
    ['[USO INTERNO] Vagas que serão fechadas.', null],
  ])('reads the description %j as %j', (description, facet) => {
    const read = facetOf(description)

    expect(read).toBe(facet)
  })
})

describe('the openings among the open issues', () => {
  it('leaves out pull requests and the locked issue the rules are pinned in, the newest opening first', () => {
    const issues = [
      issue(1, '2023-07-08T14:09:17Z', [], { locked: true }),
      issue(2, '2026-10-14T20:00:00Z', ['Python']),
      issue(3, '2026-10-20T16:31:08Z', ['Remoto']),
      issue(4, '2026-10-21T09:00:00Z', [], { pull_request: {} }),
    ]

    const jobs = openings(issues, LABELS)

    expect(jobs.map((job) => job.number)).toEqual([3, 2])
  })

  it('places each label under its facet, an undescribed label among the stack, and hides the moderation label', () => {
    const issues = [issue(7, '2026-10-20T16:31:08Z', ['Python', 'Sênior', 'Stale', 'Remoto', 'PJ', 'Rust'])]

    const [job] = openings(issues, LABELS)

    expect(job).toEqual({
      number: 7,
      title: '[Remoto] Vaga 7',
      url: 'https://github.com/backend-br/vagas/issues/7',
      opened: '2026-10-20T16:31:08Z',
      modality: ['Remoto'],
      level: ['Sênior'],
      contract: ['PJ'],
      stack: ['Python', 'Rust'],
      author: 'recrutadora',
      avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
      body: '### Descrição da vaga\n\nBackend em Python.',
    })
  })

  it('reads an opening whose author GitHub deleted and whose issue has no text', () => {
    const issues = [issue(11, '2026-10-22T10:00:00Z', [], { user: null, body: null })]

    const [job] = openings(issues, LABELS)

    expect([job?.author, job?.avatar, job?.body]).toEqual(['', '', ''])
  })

  it('leaves out an opening the triage refused and hides the labels of the triage', () => {
    const issues = [
      issue(8, '2026-10-21T10:00:00Z', ['Python', 'triagem-recusada']),
      issue(9, '2026-10-21T11:00:00Z', ['Python', 'verificada', 'revisada', 'link-quebrado', 'formato-sugerido']),
      issue(10, '2026-10-21T12:00:00Z', ['em-triagem', 'Remoto']),
    ]

    const jobs = openings(issues, LABELS)

    expect(jobs.map((job) => [job.number, job.modality, job.stack])).toEqual([
      [10, ['Remoto'], []],
      [9, [], ['Python']],
    ])
  })
})
