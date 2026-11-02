import { describe, expect, it } from 'vitest'
import {
  byLanguage,
  byStars,
  githubHome,
  languageAnchor,
  plainDescription,
  projects,
  withOrganization,
} from './projects'

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

describe('the description of a project', () => {
  it('drops the emoji shortcodes GitHub does not render', () => {
    // Given a description that starts with an emoji shortcode
    const text = ':house_with_garden: Dados relacionados aos municípios brasileiros'

    // When the description is read
    const read = plainDescription(text)

    // Then the shortcode is gone
    expect(read).toBe('Dados relacionados aos municípios brasileiros')
  })

  it('reads the markdown of the description as plain words', () => {
    // Given a description with bold text and a link
    const text = 'Controle social | **Sem atualizações** em [okfn](https://okfn.org.br)'

    // When the description is read
    const read = plainDescription(text)

    // Then only the words are kept
    expect(read).toBe('Controle social | Sem atualizações em okfn')
  })
})

describe('the projects of the organization', () => {
  const repository = (name: string, language: string | null = null) => ({
    name,
    description: null,
    html_url: `https://github.com/backend-br/${name}`,
    stargazers_count: 1,
    language,
  })

  it('adds the public repositories of the organization after the listed projects', () => {
    // Given a listed project and two repositories of the organization
    const listed = projects(README)
    const own = [repository('vagas'), repository('como-instalar-xyz')]

    // When the organization is added
    const all = withOrganization(listed, own)

    // Then both repositories follow the list, a repository without a language as Markdown
    expect(all.slice(listed.length).map((project) => [project.source, project.language])).toEqual([
      ['backend-br/vagas', 'Markdown'],
      ['backend-br/como-instalar-xyz', 'Markdown'],
    ])
  })

  it('leaves out the forum, the blog list and the site', () => {
    // Given the repositories the list leaves out
    const own = [repository('forum'), repository('poste-mais'), repository('backend-br.github.io', 'TypeScript')]

    // When the organization is added
    const all = withOrganization([], own)

    // Then none of them is added
    expect(all).toEqual([])
  })

  it('leaves out the configuration repository and a repository the list already has', () => {
    // Given the configuration repository and a repository already in the list
    const listed = [
      {
        name: 'Desafios',
        url: 'https://github.com/backend-br/desafios',
        source: 'backend-br/desafios',
        language: 'Markdown',
        links: [],
      },
    ]
    const own = [repository('.github', 'JavaScript'), repository('desafios')]

    // When the organization is added
    const all = withOrganization(listed, own)

    // Then nothing is added
    expect(all).toEqual(listed)
  })
})
