import { ORGANIZATION, rawUrl } from './catalog'
import type { Issue, Label } from './jobs'
import type { ListedRepository } from './repositories'

declare const process: { readonly env: { readonly GITHUB_TOKEN?: string } }

const API = 'https://api.github.com'

const MAX_PAGES = 10

async function fetchOk(url: string, headers?: Record<string, string>): Promise<Response>
async function fetchOk(url: string, headers: Record<string, string>, missing: 'null'): Promise<Response | null>
async function fetchOk(url: string, headers: Record<string, string> = {}, missing?: 'null'): Promise<Response | null> {
  const response = await fetch(url, { headers })
  if (missing === 'null' && response.status === 404) {
    return null
  }
  if (!response.ok) {
    const remaining = response.headers.get('x-ratelimit-remaining')
    const limit = remaining === '0' ? ' The API rate limit is spent: set GITHUB_TOKEN to raise it.' : ''
    throw new Error(`Reading ${url} answered ${response.status}.${limit}`)
  }
  return response
}

function apiHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN
  return {
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  }
}

async function listing<T>(path: string): Promise<T[]> {
  const items: T[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const separator = path.includes('?') ? '&' : '?'
    const response = await fetchOk(`${API}${path}${separator}per_page=100&page=${page}`, apiHeaders())
    const batch = (await response.json()) as T[]
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

export function labels(name: string): Promise<Label[]> {
  return listing<Label>(`/repos/${ORGANIZATION}/${name}/labels`)
}

export async function file(name: string, path: string): Promise<string> {
  return (await fetchOk(rawUrl(name, path))).text()
}

function found(path: string): Promise<Response | null> {
  return fetchOk(`${API}${path}`, apiHeaders(), 'null')
}

export async function repositoryStars(owner: string, name: string): Promise<number | null> {
  const response = await found(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`)
  return response === null ? null : ((await response.json()) as { stargazers_count: number }).stargazers_count
}

export async function accountStars(owner: string): Promise<number | null> {
  if ((await found(`/users/${encodeURIComponent(owner)}`)) === null) {
    return null
  }
  const owned = await listing<{ stargazers_count: number }>(`/users/${encodeURIComponent(owner)}/repos?type=owner`)
  return owned.reduce((total, repository) => total + repository.stargazers_count, 0)
}
