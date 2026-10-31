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
    const feed = jobsFeed([job(1, '2026-10-01T10:00:00Z'), job(2, '2026-10-02T10:00:00Z')], ORIGIN)

    expect(feed.indexOf('/vagas/2/')).toBeLessThan(feed.indexOf('/vagas/1/'))
    expect(feed).toContain('<guid isPermaLink="true">https://backend-br.github.io/vagas/2/</guid>')
    expect(feed).toContain('<pubDate>Fri, 02 Oct 2026 10:00:00 GMT</pubDate>')
    expect(feed).toContain('<description>APIs de pagamentos em Go.</description>')
    expect(feed).toContain('<category>Go</category>')
    expect(feed).toContain('<atom:link href="https://backend-br.github.io/vagas.xml" rel="self"')
  })

  it('escapes the text of the issues', () => {
    const feed = jobsFeed([job(3, '2026-10-03T10:00:00Z', { title: 'C# & .NET <Sênior>' })], ORIGIN)

    expect(feed).toContain('<title>C# &amp; .NET &lt;Sênior&gt;</title>')
    expect(escapeXml('a\u0001"b\'')).toBe('a&quot;b&apos;')
  })

  it('removes nested markup from the summary', () => {
    const text = withoutMarkup('a<!--<!-- x -->-->b <scr<script>ipt>c</script>')

    expect(text).not.toMatch(/[<>]/)
    expect(text).not.toContain(' x ')
  })

  it('keeps at most 50 jobs', () => {
    const many = Array.from({ length: 60 }, (_, index) =>
      job(index + 1, new Date(Date.UTC(2026, 9, 1, index)).toISOString()),
    )

    expect(jobsFeed(many, ORIGIN).match(/<item>/g)).toHaveLength(50)
  })
})
