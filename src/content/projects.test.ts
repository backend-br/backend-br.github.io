import { describe, expect, it } from 'vitest'
import { byLanguage, byStars, githubHome, languageAnchor, projects } from './projects'

const README = [
  '# Open-source BR',
  '',
  '| Não é um projeto | Fora da seção |',
  '|------------------|---------------|',
  '| [Antes](https://github.com/x/antes) | Go |',
  '',
  "<div id='projects'></div>",
  '',
  '## Projetos',
  '',
  '| Nome                                                 | Linguagem | Outros links                                   |',
  '|------------------------------------------------------|-----------|------------------------------------------------|',
  '| [HardInfo](https://github.com/lpereira/hardinfo)     | C         |                                                |',
  '| [Tiny Blocks](https://github.com/tiny-blocks/)       | PHP       | [Site](https://tiny-blocks.github.io)          |',
  '| [Validation](https://github.com/Respect/Validation)  | PHP       | [Documentação](https://respect.dev) [Blog](https://respect.dev/blog) |',
  '| Sem link                                             | Go        |                                                |',
  '',
  '## Licença',
  '',
  'Licenciado sob [MIT](LICENSE).',
].join('\n')

describe('the projects the README lists', () => {
  it('reads only the table under the projects section, each row that links to its source', () => {
    // Given a README with a table outside the projects section
    const readme = README

    // When the projects are read
    const list = projects(readme)

    // Then only the rows of the projects table that link to a source are listed
    expect(list.map((project) => project.name)).toEqual(['HardInfo', 'Tiny Blocks', 'Validation'])
  })

  it('reads where each project lives, its language and every other link it carries', () => {
    // Given a README with a project that carries other links
    const readme = README

    // When the projects are read
    const list = projects(readme)

    // Then that project has its source, language and links
    expect(list[2]).toEqual({
      name: 'Validation',
      url: 'https://github.com/Respect/Validation',
      source: 'Respect/Validation',
      language: 'PHP',
      links: [
        { label: 'Documentação', url: 'https://respect.dev' },
        { label: 'Blog', url: 'https://respect.dev/blog' },
      ],
    })
  })

  it('groups the projects by language, in the order each language first appears', () => {
    // Given the projects of the README
    const list = projects(README)

    // When the projects are grouped by language
    const groups = byLanguage(list)

    // Then the languages follow the order they first appear in
    expect(groups.map((group) => [group.language, group.projects.map((project) => project.source)])).toEqual([
      ['C', ['lpereira/hardinfo']],
      ['PHP', ['tiny-blocks', 'Respect/Validation']],
    ])
  })
})

describe('the anchor of a language', () => {
  it.each([
    ['C#', 'linguagem-c-sharp'],
    ['C++', 'linguagem-c-plus-plus'],
    ['Múltiplas linguagens', 'linguagem-multiplas-linguagens'],
    ['JavaScript', 'linguagem-javascript'],
  ])('names %j as %j', (language, expected) => {
    // Given the name of a language
    const name = language

    // When its anchor is made
    const made = languageAnchor(name)

    // Then it is the anchor of the row
    expect(made).toBe(expected)
  })
})

describe('where each project lives on GitHub, and its rank by stars', () => {
  it.each([
    ['https://github.com/Respect/Validation', { kind: 'repository', owner: 'Respect', name: 'Validation' }],
    ['https://www.github.com/x/y.git/', { kind: 'repository', owner: 'x', name: 'y' }],
    ['https://github.com/tiny-blocks/', { kind: 'account', owner: 'tiny-blocks' }],
    ['https://gitlab.com/x/y', null],
    ['https://github.com/x/y/tree/main', null],
  ])('tells %s apart as %j', (url, expected) => {
    // Given the address of a project
    const address = url

    // When its GitHub home is read
    const home = githubHome(address)

    // Then it is a repository, an account or nothing
    expect(home).toEqual(expected)
  })

  it('ranks the most starred first, keeps the table order between equals and leaves out the unknown', () => {
    // Given three projects, two with the same stars and one with unknown stars
    const [hardinfo, tiny, validation] = projects(README)
    if (!hardinfo || !tiny || !validation) {
      throw new Error('The README lists three projects.')
    }
    const counted = [
      { project: hardinfo, stars: 10 },
      { project: tiny, stars: null },
      { project: validation, stars: 10 },
    ]

    // When the projects are ranked by stars
    const ranked = byStars(counted)

    // Then the tie keeps the table order and the unknown is left out
    expect(ranked.map((project) => [project.name, project.stars])).toEqual([
      ['HardInfo', 10],
      ['Validation', 10],
    ])
  })
})
