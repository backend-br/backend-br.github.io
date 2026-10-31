import { createMarkdownProcessor } from '@astrojs/markdown-remark'
import { describe, expect, it } from 'vitest'
import { rehypeLineBreaks, rehypeOutline, rehypeUntrusted } from './markdown'

async function untrusted(markdown: string): Promise<string> {
  const renderer = await createMarkdownProcessor({
    syntaxHighlight: false,
    rehypePlugins: [rehypeUntrusted, rehypeOutline, rehypeLineBreaks],
  })
  return (await renderer.render(markdown)).code
}

describe('Markdown written by anyone', () => {
  it('keeps what Markdown writes, and opens a link that leaves the site beside the page', async () => {
    const markdown = '### Descrição da vaga\n\n- Python\n- **Kafka**\n\n[Candidatar-se](https://empresa.com.br/vaga)'

    const html = await untrusted(markdown)

    expect(html).toContain('<h2')
    expect(html).toContain('<li><strong>Kafka</strong></li>')
    expect(html).toContain('href="https://empresa.com.br/vaga" target="_blank" rel="noopener noreferrer nofollow ugc"')
  })

  it('drops raw HTML, a script among it', async () => {
    const markdown = 'Vaga\n\n<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n<!-- template -->'

    const html = await untrusted(markdown)

    expect(html).not.toMatch(/script|onerror|<img|template/)
    expect(html).toContain('<p>Vaga</p>')
  })

  it('drops an address that runs code, from a link and from an image', async () => {
    const markdown = '[clique](javascript:alert(1)) ![foto](data:text/html;base64,PHNjcmlwdD4=)'

    const html = await untrusted(markdown)

    expect(html).not.toMatch(/javascript:|data:/)
    expect(html).toContain('<a>clique</a>')
  })
})

describe('the headings of Markdown written by anyone', () => {
  it('start under the title of the page and never skip a level', async () => {
    const markdown = '### Sobre a empresa\n\n## Descrição\n\n#### Requisitos\n\n# Benefícios'

    const html = await untrusted(markdown)

    expect([...html.matchAll(/<(h[1-6])/g)].map((match) => match[1])).toEqual(['h2', 'h2', 'h3', 'h2'])
  })
})

describe('the line breaks of Markdown written by anyone', () => {
  it('break a paragraph where its author broke the line, as GitHub shows an issue, and leave code alone', async () => {
    const markdown = '**Sobre a Beyond**\nA Beyond é uma consultoria.\n\n- Java\n- Go\n\n```\nlinha 1\nlinha 2\n```'

    const html = await untrusted(markdown)

    expect(html).toContain('<p><strong>Sobre a Beyond</strong><br>A Beyond é uma consultoria.</p>')
    expect(html.match(/<br>/g)).toHaveLength(1)
    expect(html).toContain('linha 1\nlinha 2')
  })
})
