import { describe, expect, it } from 'vitest'
import { type Discussion, dated, expiryOf, highlighted, highlightOf, listed, summaryOf, topics } from './forum'

function discussion(number: number, extra: Partial<Discussion> = {}): Discussion {
  return {
    number,
    title: 'Pesquisa sobre IA no Brasil',
    html_url: `https://github.com/orgs/backend-br/discussions/${number}`,
    created_at: '2026-11-05T12:00:00Z',
    state: 'open',
    comments: 2,
    answer_chosen_at: null,
    category: { name: 'Geral' },
    labels: [],
    user: { login: 'juliana' },
    body: 'Uma pesquisa com a comunidade.',
    ...extra,
  }
}

const PATTERNED =
  'Uma pesquisa com a comunidade.\n\nDestaque até: 09/11/2026\nLink: https://example.com/pesquisa?ref=bb'

describe('the highlight a discussion asks for', () => {
  it('reads the last day and the link of a labelled discussion', () => {
    // Given a discussion labelled destaque that follows the pattern
    const asked = discussion(1, { labels: [{ name: 'destaque' }], body: PATTERNED })

    // When its highlight is read
    const highlight = highlightOf(asked)

    // Then it lasts until the end of that day in Brasília and carries the link
    expect(highlight).toEqual({ until: '2026-11-09T23:59:59-03:00', link: 'https://example.com/pesquisa?ref=bb' })
  })

  it('reads no highlight from a discussion no maintainer labelled', () => {
    // Given a discussion that follows the pattern without the label
    const asked = discussion(1, { body: PATTERNED })

    // When its highlight is read
    const highlight = highlightOf(asked)

    // Then there is none
    expect(highlight).toBeNull()
  })

  it('keeps a labelled discussion without a last day highlighted for good', () => {
    // Given a labelled discussion with no last day
    const asked = discussion(1, { labels: [{ name: 'destaque' }], body: 'Como contribuir com a comunidade.' })

    // When its highlight is read
    const highlight = highlightOf(asked)

    // Then it has no end
    expect(highlight).toEqual({ until: null, link: null })
  })

  it.each([
    ['with a day that does not exist', 'Destaque até: 31/02/2026'],
    ['with the day written another way', 'Destaque até: 2026-11-09'],
  ])('reads no highlight from a labelled discussion %s', (_, body) => {
    // Given a labelled discussion whose last day cannot be read
    const asked = discussion(1, { labels: [{ name: 'destaque' }], body })

    // When its highlight is read
    const highlight = highlightOf(asked)

    // Then there is none
    expect(highlight).toBeNull()
  })

  it('keeps a highlight without a link', () => {
    // Given a labelled discussion with only the last day
    const asked = discussion(1, { labels: [{ name: 'destaque' }], body: 'Destaque até: 09/11/2026' })

    // When its highlight is read
    const highlight = highlightOf(asked)

    // Then it has no link
    expect(highlight?.link).toBeNull()
  })
})

describe('the summary of a discussion', () => {
  it('leaves out the pattern lines, comments and markup', () => {
    // Given a body with a heading, a comment, a link and the pattern
    const body = `<!-- modelo -->\n## Sobre\n\nUma **pesquisa** com a [comunidade](https://example.com).\n\nDestaque até: 09/11/2026\nLink: https://example.com/`

    // When the summary is read
    const summary = summaryOf(body)

    // Then only the words remain
    expect(summary).toBe('Sobre Uma pesquisa com a comunidade.')
  })

  it('reads a list of links with escaped brackets as words', () => {
    // Given a list item whose link text escapes its brackets
    const body = '## Vagas (1)\n\n- [\\[Remoto\\] Pessoa Backend](https://example.com/vagas/1/) · Sênior'

    // When the summary is read
    const summary = summaryOf(body)

    // Then the brackets read as words and no markup remains
    expect(summary).toBe('Vagas (1) (Remoto) Pessoa Backend · Sênior')
  })
})

describe('the topics of the forum', () => {
  it('lists the most recent discussion first', () => {
    // Given discussions opened on different days
    const read = [
      discussion(1, { created_at: '2026-01-01T00:00:00Z' }),
      discussion(3, { created_at: '2026-11-01T00:00:00Z' }),
      discussion(2, { created_at: '2026-06-01T00:00:00Z' }),
    ]

    // When the topics are listed
    const listed = topics(read)

    // Then the newest comes first
    expect(listed.map((topic) => topic.number)).toEqual([3, 2, 1])
  })

  it('names a deleted author as ghost and marks an answered question', () => {
    // Given a discussion whose author left GitHub and whose answer was chosen
    const read = [discussion(1, { user: null, answer_chosen_at: '2026-11-06T00:00:00Z' })]

    // When the topics are listed
    const [topic] = topics(read)

    // Then the author is ghost and the topic is answered
    expect(topic?.author).toBe('ghost')
    expect(topic?.answered).toBe(true)
  })
})

describe('the highlighted topics', () => {
  const now = new Date('2026-11-09T15:00:00-03:00')

  it('keeps a highlight through its last day, drops it after, and shows the permanent ones last', () => {
    // Given a permanent highlight, one that ends today, one that ended yesterday, a plain topic and one no longer valid
    const listed = [
      { number: 1, expires: null, highlight: { until: null, link: null } },
      { number: 2, expires: null, highlight: { until: '2026-11-09T23:59:59-03:00', link: null } },
      { number: 3, expires: null, highlight: { until: '2026-11-08T23:59:59-03:00', link: null } },
      { number: 4, expires: null, highlight: null },
      { number: 5, expires: '2026-11-08T23:59:59-03:00', highlight: { until: null, link: null } },
    ]

    // When the highlighted topics are read
    const shown = highlighted(listed, now)

    // Then the one ending today comes before the permanent one, and the ended and invalid ones are gone
    expect(shown.map((topic) => topic.number)).toEqual([2, 1])
  })
})

describe('the topics listed below the highlights', () => {
  it('lists only the open topics that are not highlighted', () => {
    // Given an open topic, a closed one, a locked one and an open highlighted one
    const all = [
      { number: 1, open: true, expires: null },
      { number: 2, open: false, expires: null },
      { number: 3, open: false, expires: null },
      { number: 4, open: true, expires: null },
    ]

    // When the listing is read with topic 4 highlighted
    const shown = listed(all, [{ number: 4 }], new Date('2026-11-09T15:00:00-03:00'))

    // Then only the open topic outside the highlights is listed
    expect(shown.map((topic) => topic.number)).toEqual([1])
  })

  it('lists an open topic through its last valid day and drops it after', () => {
    // Given a topic valid until today and one valid until yesterday
    const all = [
      { number: 1, open: true, expires: '2026-11-09T23:59:59-03:00' },
      { number: 2, open: true, expires: '2026-11-08T23:59:59-03:00' },
    ]

    // When the listing is read today
    const shown = listed(all, [], new Date('2026-11-09T15:00:00-03:00'))

    // Then only the topic still valid is listed
    expect(shown.map((topic) => topic.number)).toEqual([1])
  })

  it('reads a closed or locked discussion as not open', () => {
    // Given a closed and a locked discussion
    const read = [discussion(1, { state: 'closed' }), discussion(2, { state: 'locked' })]

    // When the topics are listed
    const all = topics(read)

    // Then neither is open
    expect(all.map((topic) => topic.open)).toEqual([false, false])
  })
})

describe('the dated highlights', () => {
  it('keeps only the highlights that end on a day', () => {
    // Given a dated highlight and a permanent one
    const shown = [
      { number: 1, highlight: { until: '2026-11-09T23:59:59-03:00', link: null } },
      { number: 2, highlight: { until: null, link: null } },
    ]

    // When the dated ones are read
    const kept = dated(shown)

    // Then only the dated one remains
    expect(kept.map((topic) => topic.number)).toEqual([1])
  })
})

describe('the last day a discussion is shown', () => {
  it.each([
    ['a valid day', 'Resumo.\n\nVálida até: 15/11/2026', '2026-11-15T23:59:59-03:00'],
    ['no line', 'Resumo.', null],
    ['a day that cannot be read', 'Válida até: 2026-11-15', null],
  ])('reads %s', (_, body, expected) => {
    // Given a body with that line
    // When its expiry is read
    const expires = expiryOf(body)

    // Then it is the end of that day in Brasília, or none
    expect(expires).toBe(expected)
  })
})
