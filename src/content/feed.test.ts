import { describe, expect, it } from 'vitest'
import { escapeXml, type FeedJob, jobsFeed, withoutMarkup } from './feed'

function job(number: number, opened: string, extra: Partial<FeedJob> = {}): FeedJob {
  return {
    number,
    title: `[Remoto] Vaga ${number}`,
    opened,
    modality: ['Remoto'],
    level: ['Pleno'],
    contract: ['PJ'],
    stack: ['Go'],
    body: '### Descrição da vaga\n\nAPIs de pagamentos em Go.',
    ...extra,
  }
}

const ORIGIN = 'https://backend-br.github.io'

describe('the jobs feed', () => {
  it('lists the latest jobs first, linking the site pages', () => {
    // Given two jobs opened on different days
    const jobs = [job(1, '2026-10-01T10:00:00Z'), job(2, '2026-10-02T10:00:00Z')]

    // When the feed is made
    const feed = jobsFeed(jobs, ORIGIN)

    // Then the latest job comes first and the site pages are linked
    expect(feed.indexOf('/vagas/2/')).toBeLessThan(feed.indexOf('/vagas/1/'))
    expect(feed).toContain('<guid isPermaLink="true">https://backend-br.github.io/vagas/2/</guid>')
    expect(feed).toContain('<pubDate>Fri, 02 Oct 2026 10:00:00 GMT</pubDate>')
    expect(feed).toContain('<description>APIs de pagamentos em Go.</description>')
    expect(feed).toContain('<category>Go</category>')
    expect(feed).toContain('<atom:link href="https://backend-br.github.io/vagas.xml" rel="self"')
  })

  it('escapes the text of the issues', () => {
    // Given a job whose title has an ampersand and angle brackets
    const jobs = [job(3, '2026-10-03T10:00:00Z', { title: 'C# & .NET <Sênior>' })]

    // When the feed is made
    const feed = jobsFeed(jobs, ORIGIN)

    // Then the title is escaped
    expect(feed).toContain('<title>C# &amp; .NET &lt;Sênior&gt;</title>')
  })

  it('escapes the quotes of a text and drops its control characters', () => {
    // Given a text with a control character and quotes
    const text = 'a\u0001"b\''

    // When the text is escaped
    const escaped = escapeXml(text)

    // Then the control character is gone and the quotes are escaped
    expect(escaped).toBe('a&quot;b&apos;')
  })

  it('removes nested markup from the summary', () => {
    // Given a text with markup nested in markup
    const text = 'a<!--<!-- x -->-->b <scr<script>ipt>c</script>'

    // When the markup is removed
    const plain = withoutMarkup(text)

    // Then no angle bracket or comment text is left
    expect(plain).not.toMatch(/[<>]/)
    expect(plain).not.toContain(' x ')
  })

  it('keeps at most 50 jobs', () => {
    // Given sixty jobs
    const many = Array.from({ length: 60 }, (_, index) =>
      job(index + 1, new Date(Date.UTC(2026, 9, 1, index)).toISOString()),
    )

    // When the feed is made
    const feed = jobsFeed(many, ORIGIN)

    // Then it has fifty items
    expect(feed.match(/<item>/g)).toHaveLength(50)
  })
})
