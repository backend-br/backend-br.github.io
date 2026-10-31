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
  const list = projects(README)

  it('reads only the table under the projects section, each row that links to its source', () => {
    const names = list.map((project) => project.name)

    expect(names).toEqual(['HardInfo', 'Tiny Blocks', 'Validation'])
  })

  it('reads where each project lives, its language and every other link it carries', () => {
    const validation = list[2]

    expect(validation).toEqual({
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
    const groups = byLanguage(list)

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
    const made = languageAnchor(language)

    expect(made).toBe(expected)
  })
})

describe('where each project lives on GitHub, and its rank by stars', () => {
  it('tells a repository from a whole account, and leaves out anything else', () => {
    expect(githubHome('https://github.com/Respect/Validation')).toEqual({
      kind: 'repository',
      owner: 'Respect',
      name: 'Validation',
    })
    expect(githubHome('https://www.github.com/x/y.git/')).toEqual({ kind: 'repository', owner: 'x', name: 'y' })
    expect(githubHome('https://github.com/tiny-blocks/')).toEqual({ kind: 'account', owner: 'tiny-blocks' })
    expect(githubHome('https://gitlab.com/x/y')).toBeNull()
    expect(githubHome('https://github.com/x/y/tree/main')).toBeNull()
  })

  it('ranks the most starred first, keeps the table order between equals and leaves out the unknown', () => {
    const [hardinfo, tiny, validation] = projects(README)
    if (!hardinfo || !tiny || !validation) {
      throw new Error('The README lists three projects.')
    }

    const ranked = byStars([
      { project: hardinfo, stars: 10 },
      { project: tiny, stars: null },
      { project: validation, stars: 10 },
    ])

    expect(ranked.map((project) => [project.name, project.stars])).toEqual([
      ['HardInfo', 10],
      ['Validation', 10],
    ])
  })
})
