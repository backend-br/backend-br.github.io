import { describe, expect, it } from 'vitest'
import { type Cached, client, type Store } from './http'

const URL = 'https://api.github.com/example'

function storeSpy(initial: Record<string, Cached> = {}): Store & { readonly saved: Map<string, Cached> } {
  const saved = new Map(Object.entries(initial))
  return {
    saved,
    read: async (url) => saved.get(url) ?? null,
    write: async (url, cached) => {
      saved.set(url, cached)
    },
  }
}

function fetchSpy(...answers: (Response | Error)[]) {
  const calls: { url: string; headers: Record<string, string> }[] = []
  const send = (async (url: string, init?: RequestInit) => {
    calls.push({ url, headers: { ...(init?.headers as Record<string, string>) } })
    const next = answers.shift()
    if (next === undefined) {
      throw new Error('No answer left.')
    }
    if (next instanceof Error) {
      throw next
    }
    return next
  }) as typeof fetch
  return { send, calls }
}

const noWait = async () => {}

describe('a read over HTTP', () => {
  it('keeps the body of an answer that carries an ETag', async () => {
    // Given a source that answers with an ETag
    const store = storeSpy()
    const { send } = fetchSpy(new Response('fresh', { headers: { etag: '"a"' } }))

    // When the URL is read
    const body = await client({ fetch: send, store, wait: noWait })(URL)

    // Then the body is returned and kept under its ETag
    expect(body).toBe('fresh')
    expect(store.saved.get(URL)).toEqual({ etag: '"a"', body: 'fresh' })
  })

  it('revalidates a kept body and reuses it when the source answers 304', async () => {
    // Given a kept body and a source that has not changed
    const store = storeSpy({ [URL]: { etag: '"a"', body: 'kept' } })
    const { send, calls } = fetchSpy(new Response(null, { status: 304 }))

    // When the URL is read
    const body = await client({ fetch: send, store, wait: noWait })(URL, { accept: 'json' })

    // Then the request carries the kept ETag and the kept body is returned
    expect(calls[0]?.headers).toEqual({ accept: 'json', 'if-none-match': '"a"' })
    expect(body).toBe('kept')
  })

  it('replaces a kept body when the source changed', async () => {
    // Given a kept body and a source that changed since
    const store = storeSpy({ [URL]: { etag: '"a"', body: 'kept' } })
    const { send } = fetchSpy(new Response('changed', { headers: { etag: '"b"' } }))

    // When the URL is read
    const body = await client({ fetch: send, store, wait: noWait })(URL)

    // Then the new body is returned and replaces the kept one
    expect(body).toBe('changed')
    expect(store.saved.get(URL)).toEqual({ etag: '"b"', body: 'changed' })
  })

  it('reads a missing resource as null', async () => {
    // Given a source that answers 404
    const { send } = fetchSpy(new Response('', { status: 404 }))

    // When the URL is read
    const body = await client({ fetch: send, wait: noWait })(URL)

    // Then the read is null
    expect(body).toBeNull()
  })

  it('asks once for a URL read twice at the same time', async () => {
    // Given a client and a source that answers once
    const { send, calls } = fetchSpy(new Response('once'))
    const get = client({ fetch: send, wait: noWait })

    // When the URL is read twice at the same time
    const [first, second] = await Promise.all([get(URL), get(URL)])

    // Then both reads share the one answer
    expect([first, second]).toEqual(['once', 'once'])
    expect(calls).toHaveLength(1)
  })

  it('asks again for a URL whose earlier read finished', async () => {
    // Given a client and a source that answers twice
    const { send, calls } = fetchSpy(new Response('first'), new Response('second'))
    const get = client({ fetch: send, wait: noWait })

    // When the URL is read twice, one read after the other
    const first = await get(URL)
    const second = await get(URL)

    // Then each read asked the source
    expect([first, second]).toEqual(['first', 'second'])
    expect(calls).toHaveLength(2)
  })

  it('retries a server error and a dropped connection', async () => {
    // Given a source that fails twice before answering
    const { send, calls } = fetchSpy(new Response('', { status: 502 }), new Error('reset'), new Response('ok'))

    // When the URL is read
    const body = await client({ fetch: send, wait: noWait })(URL)

    // Then the third attempt answers
    expect(body).toBe('ok')
    expect(calls).toHaveLength(3)
  })

  it('waits as long as a throttled answer asks before retrying', async () => {
    // Given a source that throttles once and asks for three seconds
    const waits: number[] = []
    const wait = async (milliseconds: number) => {
      waits.push(milliseconds)
    }
    const { send } = fetchSpy(new Response('', { status: 429, headers: { 'retry-after': '3' } }), new Response('ok'))

    // When the URL is read
    await client({ fetch: send, wait })(URL)

    // Then the retry waited three seconds
    expect(waits).toEqual([3000])
  })

  it('gives up after the last retry and names the URL', async () => {
    // Given a source that keeps failing
    const { send } = fetchSpy(new Response('', { status: 500 }), new Response('', { status: 500 }))

    // When the URL is read, then the failure names it
    await expect(client({ fetch: send, retries: 1, wait: noWait })(URL)).rejects.toThrow(`Reading ${URL} answered 500.`)
  })

  it('does not retry a spent rate limit and says how to raise it', async () => {
    // Given a source whose rate limit is spent
    const { send, calls } = fetchSpy(new Response('', { status: 403, headers: { 'x-ratelimit-remaining': '0' } }))

    // When the URL is read, then the failure says how to raise the limit
    await expect(client({ fetch: send, wait: noWait })(URL)).rejects.toThrow('set GITHUB_TOKEN to raise it')

    // And the source was asked once
    expect(calls).toHaveLength(1)
  })

  it('asks again for a URL whose earlier read failed', async () => {
    // Given a read that failed
    const { send } = fetchSpy(new Response('', { status: 400 }), new Response('second'))
    const get = client({ fetch: send, retries: 0, wait: noWait })
    await get(URL).catch(() => null)

    // When the URL is read again
    const body = await get(URL)

    // Then the source is asked again
    expect(body).toBe('second')
  })
})
