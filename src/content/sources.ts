/**
 * What the site reads from GitHub when it is built: the repositories of the organization, the open
 * issues and the labels of `vagas` from the REST API, and the Markdown of `desafios` and `opensource-br`
 * as the repositories serve it. A failed request fails the build, so the site never publishes a page
 * with half of its content missing, and the published site stays the one the last good build made.
 *
 * The API answers 60 requests an hour to a reader without a token, which a build stays far below. With
 * `GITHUB_TOKEN` set, as the workflows set it, the requests are made on behalf of the repository.
 */
import { ORGANIZATION, rawUrl } from './catalog'
import type { Issue, Label } from './jobs'
import type { ListedRepository } from './repositories'

/** The environment of the build, which Node holds and the browser never sees. */
declare const process: { readonly env: { readonly GITHUB_TOKEN?: string } }

const API = 'https://api.github.com'

/** How many pages of a hundred the build reads from one listing before it stops. */
const MAX_PAGES = 10

async function fetchOk(url: string, headers: Record<string, string> = {}): Promise<Response> {
  const response = await fetch(url, { headers })
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
