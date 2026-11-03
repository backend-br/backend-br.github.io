import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface Cached {
  readonly etag: string
  readonly body: string
}

export interface Store {
  read(url: string): Promise<Cached | null>
  write(url: string, cached: Cached): Promise<void>
}

export interface ClientOptions {
  readonly fetch?: typeof fetch
  readonly store?: Store
  readonly retries?: number
  readonly timeout?: number
  readonly wait?: (milliseconds: number) => Promise<void>
}

export type Get = (url: string, headers?: Record<string, string>) => Promise<string | null>

const RETRIES = 2

const TIMEOUT = 30_000

const LONGEST_WAIT = 60_000

const NO_STORE: Store = {
  read: async () => null,
  write: async () => {},
}

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function retryable(status: number): boolean {
  return status === 429 || status >= 500
}

function backoff(response: Response | null, attempt: number): number {
  const after = Number(response?.headers.get('retry-after'))
  const asked = Number.isFinite(after) && after > 0 ? after * 1000 : 1000 * 2 ** attempt
  return Math.min(asked, LONGEST_WAIT)
}

function failure(url: string, response: Response): Error {
  const spent = response.headers.get('x-ratelimit-remaining') === '0'
  const hint = spent ? ' The API rate limit is spent: set GITHUB_TOKEN to raise it.' : ''
  return new Error(`Reading ${url} answered ${response.status}.${hint}`)
}

/**
 * Keeps each answer as one JSON file named by the hash of its URL. A file that cannot be read or written counts as
 * absent, because a lost entry only costs the next build a full download.
 */
export function fileStore(directory: string): Store {
  const path = (url: string) => join(directory, `${createHash('sha256').update(url).digest('hex')}.json`)
  return {
    read: async (url) => {
      try {
        const cached = JSON.parse(await readFile(path(url), 'utf8')) as Partial<Cached>
        return typeof cached.etag === 'string' && typeof cached.body === 'string'
          ? { etag: cached.etag, body: cached.body }
          : null
      } catch {
        return null
      }
    },
    write: async (url, cached) => {
      try {
        await mkdir(directory, { recursive: true })
        await writeFile(path(url), JSON.stringify(cached))
      } catch {}
    },
  }
}

/**
 * Reads text over HTTP, sharing one request among callers that ask for the same URL at once, revalidates what an earlier build kept through its ETag, so an
 * unchanged answer comes back as a 304 that GitHub does not charge against the rate limit, and retries throttled,
 * failed and timed-out requests. A 404 reads as null.
 */
export function client(options: ClientOptions = {}): Get {
  const { fetch: send = fetch, store = NO_STORE, retries = RETRIES, timeout = TIMEOUT, wait = pause } = options
  const inFlight = new Map<string, Promise<string | null>>()

  async function get(url: string, headers: Record<string, string>): Promise<string | null> {
    const cached = await store.read(url)
    const conditional = cached === null ? headers : { ...headers, 'if-none-match': cached.etag }
    for (let attempt = 0; ; attempt++) {
      let response: Response
      try {
        response = await send(url, { headers: conditional, signal: AbortSignal.timeout(timeout) })
      } catch (error) {
        if (attempt >= retries) {
          throw new Error(`Reading ${url} failed: ${error instanceof Error ? error.message : String(error)}`)
        }
        await wait(backoff(null, attempt))
        continue
      }
      if (response.status === 304 && cached !== null) {
        return cached.body
      }
      if (response.status === 404) {
        return null
      }
      if (response.ok) {
        const body = await response.text()
        const etag = response.headers.get('etag')
        if (etag !== null) {
          await store.write(url, { etag, body })
        }
        return body
      }
      if (retryable(response.status) && attempt < retries) {
        await wait(backoff(response, attempt))
        continue
      }
      throw failure(url, response)
    }
  }

  return (url, headers = {}) => {
    const running = inFlight.get(url)
    if (running !== undefined) {
      return running
    }
    const reading = get(url, headers).finally(() => inFlight.delete(url))
    inFlight.set(url, reading)
    return reading
  }
}
