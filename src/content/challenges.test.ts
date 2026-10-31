import { describe, expect, it } from 'vitest'
import { byLanguage, challengeIndex, firstSolution, problem, solutionCards, solutions } from './challenges'

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
  '🥇 Primeira solução: https://github.com/Bia/encurtador, enviada em 03/10/2018.',
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
    const index = challengeIndex(README)

    expect(index).toEqual([
      { slug: 'cryptography', title: 'Criptografia' },
      { slug: 'url-shortener', title: 'Encurtador de URLs' },
    ])
  })
})

describe('the statement of a challenge', () => {
  const statement = problem('url-shortener', PROBLEM)

  it('takes the title from its heading and the summary from its first paragraph, as plain words', () => {
    expect(statement.title).toBe('Encurtador de URLs')
    expect(statement.summary).toBe(
      'O seu desafio será implementar um serviço que permite encurtar URLs longas para torná-las mais compactas.',
    )
  })

  it('keeps the rest of the statement and leaves out the section that points to the solutions', () => {
    const headings = statement.body.split('\n').filter((line) => line.startsWith('## '))

    expect(statement.body.startsWith('Ele deve responder rápido')).toBe(true)
    expect(headings).toEqual(['## Exemplo', '## não é um título', '## Requisitos'])
  })

  it('makes links and images relative to the challenge absolute and keeps outside links', () => {
    expect(statement.body).toContain(
      '[diagrama](https://github.com/backend-br/desafios/blob/HEAD/url-shortener/docs/fluxo.md)',
    )
    expect(statement.body).toContain(
      '![fluxo](https://raw.githubusercontent.com/backend-br/desafios/HEAD/url-shortener/docs/fluxo.png)',
    )
    expect(statement.body).toContain('[RFC](https://www.rfc-editor.org/rfc/rfc3986)')
  })
})

describe('the solutions of a challenge', () => {
  it('reads every row that names a repository, bare or linked, and skips a row without one', () => {
    const list = solutions(SOLUTIONS)

    expect(list).toEqual([
      { language: 'Go', repository: 'https://github.com/reisvitt/url-shortener-go' },
      { language: 'PHP', repository: 'https://github.com/ana/encurtador' },
      { language: 'Php', repository: 'https://github.com/bia/encurtador' },
      { language: 'PHP', repository: 'https://github.com/caio/encurtador' },
    ])
  })

  it('groups the spellings of one language under the one most rows use, the most solved language first', () => {
    const list = solutions(SOLUTIONS)

    const groups = byLanguage(list)

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

  it('reads the first solution from the line that names it, without the punctuation that follows the link', () => {
    expect(firstSolution(SOLUTIONS)).toBe('https://github.com/Bia/encurtador')
    expect(firstSolution('| `Go` | https://github.com/a/b | primeira solução |')).toBeNull()
  })

  it('presents the first solution ahead of the rest, which stay grouped by language', () => {
    const cards = solutionCards(solutions(SOLUTIONS), firstSolution(SOLUTIONS))

    expect(cards.map((card) => `${card.owner}/${card.name}`)).toEqual([
      'bia/encurtador',
      'ana/encurtador',
      'caio/encurtador',
      'reisvitt/url-shortener-go',
    ])
    expect(cards.filter((card) => card.first)).toHaveLength(1)
    expect(cards[0]?.language).toBe('PHP')
  })

  it('marks no card when no line names the first solution', () => {
    expect(solutionCards(solutions(SOLUTIONS), null).some((card) => card.first)).toBe(false)
  })
})
