import { ORGANIZATION, rawUrl } from './catalog'
import type { Discussion } from './forum'
import { client, fileStore } from './http'
import type { Issue, Label } from './jobs'
import type { ListedRepository } from './repositories'

const API = 'https://api.github.com'

const MAX_PAGES = 10

const CACHE = process.env.SOURCES_CACHE ?? 'node_modules/.cache/backend-br-sources'

const get = client({ store: fileStore(CACHE) })

async function required(url: string, headers?: Record<string, string>): Promise<string> {
  const body = await get(url, headers)
  if (body === null) {
    throw new Error(`Reading ${url} answered 404.`)
  }
  return body
}

function apiHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN
  return {
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  }
}

async function listing<T>(path: string, pages = MAX_PAGES): Promise<T[]> {
  const items: T[] = []
  for (let page = 1; page <= pages; page++) {
    const separator = path.includes('?') ? '&' : '?'
    const batch = JSON.parse(await required(`${API}${path}${separator}per_page=100&page=${page}`, apiHeaders())) as T[]
    items.push(...batch)
    if (batch.length < 100) {
      break
    }
  }
  return items
}

export function organizationRepositories(): Promise<ListedRepository[]> {
  return listing<ListedRepository>(`/orgs/${ORGANIZATION}/repos?type=public`)
}

export function openIssues(name: string): Promise<Issue[]> {
  return listing<Issue>(`/repos/${ORGANIZATION}/${name}/issues?state=open&sort=created&direction=desc`)
}

export function closedIssues(name: string): Promise<Issue[]> {
  return listing<Issue>(`/repos/${ORGANIZATION}/${name}/issues?state=closed&sort=created&direction=desc`, 1)
}

export function discussions(name: string): Promise<Discussion[]> {
  return listing<Discussion>(`/repos/${ORGANIZATION}/${name}/discussions`)
}

export function labels(name: string): Promise<Label[]> {
  return listing<Label>(`/repos/${ORGANIZATION}/${name}/labels`)
}

export function file(name: string, path: string): Promise<string> {
  return required(rawUrl(name, path))
}

export function optionalFile(name: string, path: string): Promise<string | null> {
  return get(rawUrl(name, path))
}

async function found<T>(path: string): Promise<T | null> {
  const body = await get(`${API}${path}`, apiHeaders())
  return body === null ? null : (JSON.parse(body) as T)
}

export interface GitHubFacts {
  readonly stars: number
  readonly description: string
}

export async function repositoryFacts(owner: string, name: string): Promise<GitHubFacts | null> {
  const repository = await found<{ stargazers_count: number; description: string | null }>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
  )
  if (repository === null) {
    return null
  }
  return { stars: repository.stargazers_count, description: (repository.description ?? '').trim() }
}

async function organizationDescription(owner: string): Promise<string> {
  const organization = await found<{ description: string | null }>(`/orgs/${encodeURIComponent(owner)}`)
  return organization?.description ?? ''
}

export async function accountFacts(owner: string): Promise<GitHubFacts | null> {
  const account = await found<{ type: string; bio: string | null }>(`/users/${encodeURIComponent(owner)}`)
  if (account === null) {
    return null
  }
  const owned = await listing<{ stargazers_count: number }>(`/users/${encodeURIComponent(owner)}/repos?type=owner`)
  const description = account.bio ?? (account.type === 'Organization' ? await organizationDescription(owner) : '')
  return {
    stars: owned.reduce((total, repository) => total + repository.stargazers_count, 0),
    description: description.trim(),
  }
}
