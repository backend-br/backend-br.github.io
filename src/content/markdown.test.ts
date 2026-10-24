import { createMarkdownProcessor } from '@astrojs/markdown-remark'
import { describe, expect, it } from 'vitest'
import { rehypeLineBreaks, rehypeOutline, rehypeUntrusted } from './markdown'

/** Answers a Markdown text as the site renders the text of an opening. */
async function untrusted(markdown: string): Promise<string> {
  const renderer = await createMarkdownProcessor({
    syntaxHighlight: false,
    rehypePlugins: [rehypeUntrusted, rehypeOutline, rehypeLineBreaks],
  })
  return (await renderer.render(markdown)).code
}

describe('Markdown written by anyone', () => {
  it('keeps what Markdown writes, and opens a link that leaves the site beside the page', async () => {
    // Given a heading, a list and a link to another site
    const markdown = '### Descrição da vaga\n\n- Python\n- **Kafka**\n\n[Candidatar-se](https://empresa.com.br/vaga)'

    // When it is rendered
    const html = await untrusted(markdown)

    // Then the heading, the list and the link are there, the link opening beside the page
    expect(html).toContain('<h2')
    expect(html).toContain('<li><strong>Kafka</strong></li>')
    expect(html).toContain('href="https://empresa.com.br/vaga" target="_blank" rel="noopener noreferrer nofollow ugc"')
  })

  it('drops raw HTML, a script among it', async () => {
    // Given a text that hides a script, an image that runs code when it fails, and a comment
    const markdown = 'Vaga\n\n<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">\n\n<!-- template -->'

    // When it is rendered
    const html = await untrusted(markdown)

    // Then none of that HTML is left
    expect(html).not.toMatch(/script|onerror|<img|template/)
    expect(html).toContain('<p>Vaga</p>')
  })

  it('drops an address that runs code, from a link and from an image', async () => {
    // Given a link and an image whose address is a script
    const markdown = '[clique](javascript:alert(1)) ![foto](data:text/html;base64,PHNjcmlwdD4=)'

    // When it is rendered
    const html = await untrusted(markdown)

    // Then the link and the image are left with no address
    expect(html).not.toMatch(/javascript:|data:/)
    expect(html).toContain('<a>clique</a>')
  })
})

describe('the headings of Markdown written by anyone', () => {
  it('start under the title of the page and never skip a level', async () => {
    // Given headings that start at the third level, jump from the second to the fourth, and use the first
    const markdown = '### Sobre a empresa\n\n## Descrição\n\n#### Requisitos\n\n# Benefícios'

    // When it is rendered
    const html = await untrusted(markdown)

    // Then the outline runs h2, h2, h3, h2
    expect([...html.matchAll(/<(h[1-6])/g)].map((match) => match[1])).toEqual(['h2', 'h2', 'h3', 'h2'])
  })
})

describe('the line breaks of Markdown written by anyone', () => {
  it('break a paragraph where its author broke the line, as GitHub shows an issue, and leave code alone', async () => {
    // Given a paragraph written on two lines, a list and a block of code on two lines
    const markdown = '**Sobre a Beyond**\nA Beyond é uma consultoria.\n\n- Java\n- Go\n\n```\nlinha 1\nlinha 2\n```'

    // When it is rendered
    const html = await untrusted(markdown)

    // Then the paragraph breaks between its lines, the list and the code keep their own, and no block breaks
    expect(html).toContain('<p><strong>Sobre a Beyond</strong><br>A Beyond é uma consultoria.</p>')
    expect(html.match(/<br>/g)).toHaveLength(1)
    expect(html).toContain('linha 1\nlinha 2')
  })
})
