import { describe, expect, it } from 'vitest'
import { catalogued, type ListedRepository } from './repositories'

const LISTED: readonly ListedRepository[] = [
  {
    name: 'forum',
    description: ' Dúvidas, sugestões e questões em gerais sobre backend. ',
    html_url: 'https://github.com/backend-br/forum',
    stargazers_count: 517,
  },
  {
    name: 'backend-br.github.io',
    description: 'Página oficial da comunidade brasileira de backenders.',
    html_url: 'https://github.com/backend-br/backend-br.github.io',
    stargazers_count: 71,
  },
  { name: 'vagas', description: null, html_url: 'https://github.com/backend-br/vagas', stargazers_count: 8016 },
]

describe('the repositories of the catalog', () => {
  it('reads each one as the organization lists it, in the order of the catalog, leaving out the rest', () => {
    // Given a catalog that names two of the listed repositories, one of them with a page on the site

    // When the catalog is read against the listing
    const { repositories } = catalogued(
      [{ name: 'vagas', page: { path: '/vagas/', label: 'Ver as vagas' } }, { name: 'forum' }],
      LISTED,
    )

    // Then both come in the order of the catalog, with their description trimmed, or empty when there is none
    expect(repositories).toEqual([
      {
        name: 'vagas',
        description: '',
        url: 'https://github.com/backend-br/vagas',
        stars: 8016,
        page: { path: '/vagas/', label: 'Ver as vagas' },
      },
      {
        name: 'forum',
        description: 'Dúvidas, sugestões e questões em gerais sobre backend.',
        url: 'https://github.com/backend-br/forum',
        stars: 517,
        page: null,
      },
    ])
  })

  it('names every repository of the catalog the organization no longer lists', () => {
    // Given a catalog that names a repository the listing lacks

    // When the catalog is read against the listing
    const { missing } = catalogued([{ name: 'forum' }, { name: 'eventos' }], LISTED)

    // Then the missing repository is named
    expect(missing).toEqual(['eventos'])
  })
})
