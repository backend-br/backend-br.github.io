/**
 * What the site reads from GitHub when it is built: the repositories of the organization, the open
 * issues and the labels of `vagas` from the REST API, and the Markdown of `desafios` and `opensource-br`
 * as the repositories serve it. A failed request fails the build, so the site never publishes a page
 * with half of its content missing, and the published site stays the one the last good build made.
 *
 * The API answers 60 requests an hour to a reader without a token, and the stars of the projects take one
 * request each, so a build needs `GITHUB_TOKEN`, as the workflows set it, to stay under the limit; with it
 * the requests are made on behalf of the repository.
 */
import { ORGANIZATION, rawUrl } from './catalog'
import type { Issue, Label } from './jobs'
import type { ListedRepository } from './repositories'

/** The environment of the build, which Node holds and the browser never sees. */
declare const process: { readonly env: { readonly GITHUB_TOKEN?: string } }

const API = 'https://api.github.com'

/** How many pages of a hundred the build reads from one listing before it stops. */
const MAX_PAGES = 10

/**
 * Answers the response to a request, failing on any answer but a success, or answering null for a 404
 * when the caller reads a missing thing as an answer of its own.
 */
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

/** Answers every item of a listing of the API, page after page, until a page comes back short. */
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

/** Answers the open issues of a repository, the newest first, pull requests included as the API lists them. */
export function openIssues(name: string): Promise<Issue[]> {
  return listing<Issue>(`/repos/${ORGANIZATION}/${name}/issues?state=open&sort=created&direction=desc`)
}

export function labels(name: string): Promise<Label[]> {
  return listing<Label>(`/repos/${ORGANIZATION}/${name}/labels`)
}

/** Answers a file of a repository as it is. */
export async function file(name: string, path: string): Promise<string> {
  return (await fetchOk(rawUrl(name, path))).text()
}

/** Answers a response of the API, or null when what it names does not exist there. */
function found(path: string): Promise<Response | null> {
  return fetchOk(`${API}${path}`, apiHeaders(), 'null')
}

/** Answers the stars of a public repository, or null when GitHub has none at that name. */
export async function repositoryStars(owner: string, name: string): Promise<number | null> {
  const response = await found(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`)
  return response === null ? null : ((await response.json()) as { stargazers_count: number }).stargazers_count
}

/** Answers the stars of every public repository of an account added up, or null when GitHub has no such account. */
export async function accountStars(owner: string): Promise<number | null> {
  if ((await found(`/users/${encodeURIComponent(owner)}`)) === null) {
    return null
  }
  const owned = await listing<{ stargazers_count: number }>(`/users/${encodeURIComponent(owner)}/repos?type=owner`)
  return owned.reduce((total, repository) => total + repository.stargazers_count, 0)
}
