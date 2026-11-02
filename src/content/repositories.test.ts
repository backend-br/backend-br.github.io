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
    // Given a catalog of two repositories, one with a page, among the three the organization lists
    const catalog = [{ name: 'vagas', page: { path: '/vagas/', label: 'Ver as vagas' } }, { name: 'forum' }]

    // When the catalog is read
    const { repositories } = catalogued(catalog, LISTED)

    // Then each repository is read in the order of the catalog and the rest is left out
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
    // Given a catalog with a repository the organization does not list
    const catalog = [{ name: 'forum' }, { name: 'eventos' }]

    // When the catalog is read
    const { missing } = catalogued(catalog, LISTED)

    // Then the unlisted repository is named
    expect(missing).toEqual(['eventos'])
  })
})
