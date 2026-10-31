import type { CatalogEntry, Page } from './catalog'

export interface ListedRepository {
  readonly name: string
  readonly description: string | null
  readonly html_url: string
  readonly stargazers_count: number
}

export interface Repository {
  readonly name: string
  readonly description: string
  readonly url: string
  readonly stars: number
  readonly page: Page | null
}

export interface Catalogued {
  readonly repositories: readonly Repository[]
  readonly missing: readonly string[]
}

export function catalogued(catalog: readonly CatalogEntry[], listed: readonly ListedRepository[]): Catalogued {
  const byName = new Map(listed.map((repository) => [repository.name, repository]))
  const repositories = catalog.flatMap((entry) => {
    const repository = byName.get(entry.name)
    if (repository === undefined) {
      return []
    }
    return [
      {
        name: repository.name,
        description: (repository.description ?? '').trim(),
        url: repository.html_url,
        stars: repository.stargazers_count,
        page: entry.page ?? null,
      },
    ]
  })
  return { repositories, missing: catalog.filter((entry) => !byName.has(entry.name)).map((entry) => entry.name) }
}
