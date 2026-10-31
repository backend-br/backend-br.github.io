export const ORGANIZATION = 'backend-br'

export const BRANCH = 'HEAD'

export interface Page {
  readonly path: string
  readonly label: string
}

export interface CatalogEntry {
  readonly name: string
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

export function avatarOf(login: string): string {
  return `https://avatars.githubusercontent.com/${encodeURIComponent(login)}`
}

export function repositoryUrl(name: string): string {
  return `https://github.com/${ORGANIZATION}/${name}`
}

export function blobUrl(name: string, path: string): string {
  return `${repositoryUrl(name)}/blob/${BRANCH}/${path}`
}

export function rawUrl(name: string, path: string): string {
  return `https://raw.githubusercontent.com/${ORGANIZATION}/${name}/${BRANCH}/${path}`
}
