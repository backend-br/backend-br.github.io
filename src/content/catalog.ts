/**
 * The repositories of Back-End Brasil the site presents, and where each one is read from. What each
 * repository says about itself (its description, its stars) is read from GitHub when the site is built,
 * so presenting another repository takes one line here.
 */

export const ORGANIZATION = 'backend-br'

/** The default branch of every repository, named by the reference GitHub resolves whatever the branch is called. */
export const BRANCH = 'HEAD'

/** A page of this site drawn from a repository, and what the link to it says. */
export interface Page {
  readonly path: string
  readonly label: string
}

export interface CatalogEntry {
  /** The name of the repository on GitHub. */
  readonly name: string
  /** The page of this site drawn from the repository, when there is one. */
  readonly page?: Page
}

export const CATALOG: readonly CatalogEntry[] = [
  { name: 'vagas', page: { path: '/vagas/', label: 'Ver as vagas' } },
  { name: 'desafios', page: { path: '/desafios/', label: 'Ver os desafios' } },
  { name: 'opensource-br', page: { path: '/projetos/', label: 'Ver os projetos' } },
  { name: 'forum' },
  { name: 'como-instalar-xyz' },
  { name: 'me-contrata' },
  { name: 'eventos' },
  { name: 'poste-mais' },
]

export function repositoryUrl(name: string): string {
  return `https://github.com/${ORGANIZATION}/${name}`
}

/** The address a file of a repository is shown at on GitHub. */
export function blobUrl(name: string, path: string): string {
  return `${repositoryUrl(name)}/blob/${BRANCH}/${path}`
}

/** The address a file of a repository is served from as it is, which is where the build reads it. */
export function rawUrl(name: string, path: string): string {
  return `https://raw.githubusercontent.com/${ORGANIZATION}/${name}/${BRANCH}/${path}`
}
