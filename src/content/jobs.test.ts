import { describe, expect, it } from 'vitest'
import { facetOf, type Issue, type Job, type Label, openings, shortlist } from './jobs'

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
    // Given the description of a label
    const text = description

    // When the facet is read
    const read = facetOf(text)

    // Then it is the facet of the row
    expect(read).toBe(facet)
  })
})

describe('the openings among the open issues', () => {
  it('leaves out pull requests and the locked issue the rules are pinned in, the newest opening first', () => {
    // Given a locked issue, a pull request and two open issues
    const issues = [
      issue(1, '2023-07-08T14:09:17Z', [], { locked: true }),
      issue(2, '2026-10-14T20:00:00Z', ['Python']),
      issue(3, '2026-10-20T16:31:08Z', ['Remoto']),
      issue(4, '2026-10-21T09:00:00Z', [], { pull_request: {} }),
    ]

    // When the openings are read
    const jobs = openings(issues, LABELS)

    // Then only the two open issues are listed, the newest first
    expect(jobs.map((job) => job.number)).toEqual([3, 2])
  })

  it('places each label under its facet, an undescribed label among the stack, and hides the moderation label', () => {
    // Given an issue with a label of each facet, an undescribed one and a moderation one
    const issues = [issue(7, '2026-10-20T16:31:08Z', ['Python', 'Sênior', 'Stale', 'Remoto', 'PJ', 'Rust'])]

    // When the openings are read
    const [job] = openings(issues, LABELS)

    // Then each label is under its facet and the moderation label is hidden
    expect(job).toEqual({
      number: 7,
      title: '[Remoto] Vaga 7',
      url: 'https://github.com/backend-br/vagas/issues/7',
      opened: '2026-10-20T16:31:08Z',
      open: true,
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
    // Given an issue with no author and no text
    const issues = [issue(11, '2026-10-22T10:00:00Z', [], { user: null, body: null })]

    // When the openings are read
    const [job] = openings(issues, LABELS)

    // Then the author, the avatar and the body are empty
    expect([job?.author, job?.avatar, job?.body]).toEqual(['', '', ''])
  })

  it('leaves out an opening the triage refused and hides the labels of the triage', () => {
    // Given issues with triage labels, one of them refused
    const issues = [
      issue(8, '2026-10-21T10:00:00Z', ['Python', 'triagem-recusada']),
      issue(9, '2026-10-21T11:00:00Z', ['Python', 'verificada', 'revisada', 'link-quebrado', 'formato-sugerido']),
      issue(10, '2026-10-21T12:00:00Z', ['em-triagem', 'Remoto']),
    ]

    // When the openings are read
    const jobs = openings(issues, LABELS)

    // Then the refused one is gone and the triage labels are hidden
    expect(jobs.map((job) => [job.number, job.modality, job.stack])).toEqual([
      [10, ['Remoto'], []],
      [9, [], ['Python']],
    ])
  })
})

describe('the closed openings', () => {
  it('lists only the completed ones without a broken link, after the open ones', () => {
    // Given closed issues completed, not planned, duplicate, without a reason and with a broken link, and an open one
    const issues = [
      issue(20, '2026-10-25T10:00:00Z', [], { state: 'closed', state_reason: 'completed' }),
      issue(21, '2026-10-26T10:00:00Z', [], { state: 'closed', state_reason: 'not_planned' }),
      issue(22, '2026-10-27T10:00:00Z', ['link-quebrado'], { state: 'closed', state_reason: 'completed' }),
      issue(24, '2026-10-28T10:00:00Z', [], { state: 'closed', state_reason: 'duplicate' }),
      issue(25, '2026-10-29T10:00:00Z', [], { state: 'closed', state_reason: null }),
      issue(23, '2026-10-01T10:00:00Z', [], { state: 'open' }),
    ]

    // When the openings are read
    const jobs = openings(issues, LABELS)

    // Then the open one comes first and only the completed closed one follows
    expect(jobs.map((job) => [job.number, job.open])).toEqual([
      [23, true],
      [20, false],
    ])
  })
})

describe('the shortlist', () => {
  const job = (number: number, open: boolean): Job => ({
    number,
    title: `Vaga ${number}`,
    url: '',
    opened: '',
    open,
    modality: [],
    level: [],
    contract: [],
    stack: [],
    author: '',
    avatar: '',
    body: '',
  })

  it('fills up to the minimum with the latest closed openings', () => {
    // Given two open and three closed openings
    const jobs = [job(1, true), job(2, true), job(3, false), job(4, false), job(5, false)]

    // When the shortlist is made with a minimum of four
    const listed = shortlist(jobs, 4)

    // Then the two open ones are filled up with the latest closed ones
    expect(listed.map((opening) => opening.number)).toEqual([1, 2, 3, 4])
  })

  it('keeps every open opening and no closed one once the minimum is reached', () => {
    // Given three open and one closed opening
    const jobs = [job(1, true), job(2, true), job(3, true), job(4, false)]

    // When the shortlist is made with a minimum of two
    const listed = shortlist(jobs, 2)

    // Then every open one is kept and the closed one is left out
    expect(listed.map((opening) => opening.number)).toEqual([1, 2, 3])
  })
})
