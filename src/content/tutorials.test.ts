import { describe, expect, it } from 'vitest'
import {
  isToolIndex,
  joined,
  systemSlug,
  toolIndex,
  toolIndexPath,
  toolPage,
  toolReadmeOf,
  tutorial,
} from './tutorials'

const README = [
  '# Como instalar XYZ',
  '',
  '### Linguagens',
  '',
  '| Nome | Linux | macOS | Windows |',
  '|------|-------|-------|---------|',
  '| Ruby | [Linux](tutoriais/ruby/linux.md) | [macOS](tutoriais/ruby/macos.md) | |',
  '| Rust | [Arch Linux, Debian](tutoriais/rust/README.md) | | |',
  '',
  '### Outros',
  '',
  '| Nome | Linux | macOS | Windows |',
  '|------|-------|-------|---------|',
  '| Docker | [Ubuntu](tutoriais/docker/README.md) | | |',
  '| Vazio | | | |',
].join('\n')

const TUTORIAL = [
  '# Docker no Ubuntu',
  '',
  'O Docker cria e executa aplicações em **containers**.',
  '',
  '## Requisitos',
  '',
  '- Nenhum.',
  '',
  '## Instalação',
  '',
  '```bash',
  '# comentário do shell',
  'sudo apt install docker',
  '```',
  '',
  '## Referências',
  '',
  '- [Guia](../README.md)',
].join('\n')

describe('the tools the README lists', () => {
  it('reads each tool with its category and the paths its row links', () => {
    // Given a README with two categories
    const readme = README

    // When the tools are read
    const tools = toolIndex(readme)

    // Then each linked row is a tool under its category
    expect(tools).toEqual([
      {
        category: 'Linguagens',
        name: 'Ruby',
        slug: 'ruby',
        paths: ['tutoriais/ruby/linux.md', 'tutoriais/ruby/macos.md'],
      },
      { category: 'Linguagens', name: 'Rust', slug: 'rust', paths: ['tutoriais/rust/README.md'] },
      { category: 'Outros', name: 'Docker', slug: 'docker', paths: ['tutoriais/docker/README.md'] },
    ])
  })
})

describe('the index of a tool', () => {
  it('reads the description and the tutorials it links, relative to its folder', () => {
    // Given the index of a tool linking two tutorials
    const markdown =
      '# Docker\n\nPlataforma de containers.\n\n## Tutoriais\n\n- [Ubuntu](./linux/ubuntu.md)\n- [Arch Linux](linux/archlinux.md)'

    // When the index is read
    const page = toolPage('tutoriais/docker/README.md', markdown)

    // Then it carries the description and both tutorial paths
    expect(page).toEqual({
      summary: 'Plataforma de containers.',
      paths: ['tutoriais/docker/linux/ubuntu.md', 'tutoriais/docker/linux/archlinux.md'],
    })
  })

  it.each([
    ['tutoriais/docker/README.md', true],
    ['tutoriais/rust', true],
    ['tutoriais/ruby/linux.md', false],
  ])('treats %s as an index: %s', (path, expected) => {
    // Given a linked path
    const linked = path

    // When it is classified
    const index = isToolIndex(linked)

    // Then only a README or a folder is an index
    expect(index).toBe(expected)
  })

  it('points a folder link at its README', () => {
    // Given a link to a tool folder
    const path = 'tutoriais/rust'

    // When the index path is resolved
    const index = toolIndexPath(path)

    // Then it is the README inside the folder
    expect(index).toBe('tutoriais/rust/README.md')
  })
})

describe('the README of a tool', () => {
  it('lives in the folder of the tool, whatever the depth of the tutorial', () => {
    // Given a tutorial two levels under the tool folder
    const path = 'tutoriais/ruby/linux.md'

    // When the README of its tool is located
    const readme = toolReadmeOf(path)

    // Then it is the README of the tool folder
    expect(readme).toBe('tutoriais/ruby/README.md')
  })
})

describe('a tutorial', () => {
  it('takes the title, the system after "no" and the first paragraph as plain words', () => {
    // Given a tutorial that follows the template
    const markdown = TUTORIAL

    // When the tutorial is read
    const read = tutorial('tutoriais/docker/linux/ubuntu.md', markdown)

    // Then the title, system and summary come from its opening
    expect([read.title, read.system, read.summary]).toEqual([
      'Docker no Ubuntu',
      'Ubuntu',
      'O Docker cria e executa aplicações em containers.',
    ])
  })

  it('keeps the sections and makes relative links absolute, without taking a shell comment for a title', () => {
    // Given a tutorial with a shell comment and a relative link
    const markdown = TUTORIAL

    // When the tutorial is read
    const { body } = tutorial('tutoriais/docker/linux/ubuntu.md', markdown)

    // Then the sections stay and the link points at the repository
    expect(body).toContain('## Requisitos')
    expect(body).toContain('# comentário do shell')
    expect(body).toContain('(https://github.com/backend-br/como-instalar-xyz/blob/HEAD/tutoriais/docker/README.md)')
  })

  it('names the system after the file when the title does not', () => {
    // Given a tutorial whose title names no system
    const markdown = '# Ruby\n\nInstala o Ruby.\n\n## Requisitos\n\n- Nenhum.'

    // When the tutorial is read
    const read = tutorial('tutoriais/ruby/windows.md', markdown)

    // Then the system comes from the file name
    expect(read.system).toBe('Windows')
  })
})

describe('the paths and slugs', () => {
  it('joins a relative target onto a folder', () => {
    // Given a folder and a target that climbs one level
    const target = '../linux/ubuntu.md'

    // When they are joined
    const path = joined('tutoriais/docker/windows', target)

    // Then the result is the normalized path
    expect(path).toBe('tutoriais/docker/linux/ubuntu.md')
  })

  it('turns a system name into a slug without accents or spaces', () => {
    // Given a system name with a space
    const system = 'Arch Linux'

    // When it becomes a slug
    const slug = systemSlug(system)

    // Then it is lower case and hyphenated
    expect(slug).toBe('arch-linux')
  })
})
