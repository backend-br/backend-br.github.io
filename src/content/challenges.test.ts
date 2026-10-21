import { describe, expect, it } from 'vitest'
import { byLanguage, challengeIndex, problem, solutions } from './challenges'

const README = [
  '# Desafios',
  '',
  '## Comece a solucionar',
  '',
  '- [Criptografia](cryptography/PROBLEM.md)',
  '- [Encurtador de URLs](./url-shortener/PROBLEM.md)',
  '- [Criptografia de novo](cryptography/PROBLEM.md)',
  '',
  '## Contribuindo',
  '',
  'Siga as [diretrizes de contribuição](CONTRIBUTING.md).',
].join('\n')

const PROBLEM = [
  '# Encurtador de URLs',
  '',
  'O seu desafio será implementar um serviço que permite **encurtar** URLs',
  'longas para torná-las mais compactas.',
  '',
  'Ele deve responder rápido, veja o [diagrama](docs/fluxo.md).',
  '',
  '## Exemplo',
  '',
  '```http',
  '## não é um título',
  '```',
  '',
  '![fluxo](docs/fluxo.png)',
  '',
  '## Requisitos',
  '',
  '- Apenas letras e números, como na [RFC](https://www.rfc-editor.org/rfc/rfc3986).',
  '',
  '## Soluções',
  '',
  'Neste [tópico](SOLUTIONS.md), você encontrará soluções.',
].join('\n')

const SOLUTIONS = [
  '# Soluções - Encurtador de URLs',
  '',
  '| Linguagem    | Repositório                                  |',
  '|:-------------|:---------------------------------------------|',
  '| `Go`         | https://github.com/reisvitt/url-shortener-go |   ',
  '| `PHP`        | https://github.com/ana/encurtador 	          |',
  '| `Php`        | [encurtador](https://github.com/bia/encurtador) |',
  '| `PHP`        | https://github.com/caio/encurtador           |',
  '| `Java`       |                                              |',
].join('\n')

describe('the challenges the README lists', () => {
  it('reads each linked statement once, in the order of the README', () => {
    // Given a README that links two challenges, one of them twice

    // When the challenges are read from it
    const index = challengeIndex(README)

    // Then each challenge is listed once, under its folder and the title of its first link
    expect(index).toEqual([
      { slug: 'cryptography', title: 'Criptografia' },
      { slug: 'url-shortener', title: 'Encurtador de URLs' },
    ])
  })
})

describe('the statement of a challenge', () => {
  const statement = problem('url-shortener', PROBLEM)

  it('takes the title from its heading and the summary from its first paragraph, as plain words', () => {
    // Given the PROBLEM.md of a challenge

    // When its statement is read

    // Then the title and the summary come out as a reader sees them
    expect(statement.title).toBe('Encurtador de URLs')
    expect(statement.summary).toBe(
      'O seu desafio será implementar um serviço que permite encurtar URLs longas para torná-las mais compactas.',
    )
  })

  it('keeps the rest of the statement and leaves out the section that points to the solutions', () => {
    // Given the PROBLEM.md of a challenge

    // When its statement is read
    const headings = statement.body.split('\n').filter((line) => line.startsWith('## '))

    // Then the body opens after the summary and keeps every section but the solutions, a heading inside code included as code
    expect(statement.body.startsWith('Ele deve responder rápido')).toBe(true)
    expect(headings).toEqual(['## Exemplo', '## não é um título', '## Requisitos'])
  })

  it('makes links and images relative to the challenge absolute and keeps outside links', () => {
    // Given a statement that links a file of its folder, shows an image of it and links an outside site

    // When its statement is read

    // Then the file is linked on GitHub, the image is read as it is served, and the outside link stays
    expect(statement.body).toContain(
      '[diagrama](https://github.com/backend-br/desafios/blob/master/url-shortener/docs/fluxo.md)',
    )
    expect(statement.body).toContain(
      '![fluxo](https://raw.githubusercontent.com/backend-br/desafios/master/url-shortener/docs/fluxo.png)',
    )
    expect(statement.body).toContain('[RFC](https://www.rfc-editor.org/rfc/rfc3986)')
  })
})

describe('the solutions of a challenge', () => {
  it('reads every row that names a repository, bare or linked, and skips a row without one', () => {
    // Given a SOLUTIONS.md whose rows carry stray spaces and tabs, a linked repository and an empty one

    // When its solutions are read
    const list = solutions(SOLUTIONS)

    // Then each repository is read with its language and the empty row is left out
    expect(list).toEqual([
      { language: 'Go', repository: 'https://github.com/reisvitt/url-shortener-go' },
      { language: 'PHP', repository: 'https://github.com/ana/encurtador' },
      { language: 'Php', repository: 'https://github.com/bia/encurtador' },
      { language: 'PHP', repository: 'https://github.com/caio/encurtador' },
    ])
  })

  it('groups the spellings of one language under the one most rows use, the most solved language first', () => {
    // Given solutions where PHP is spelled two ways
    const list = solutions(SOLUTIONS)

    // When they are grouped by language
    const groups = byLanguage(list)

    // Then PHP holds its three solutions under its most used spelling, ahead of Go
    expect(groups).toEqual([
      {
        language: 'PHP',
        repositories: [
          'https://github.com/ana/encurtador',
          'https://github.com/bia/encurtador',
          'https://github.com/caio/encurtador',
        ],
      },
      { language: 'Go', repositories: ['https://github.com/reisvitt/url-shortener-go'] },
    ])
  })
})
