import type { APIRoute } from 'astro'
import { jobs } from '../content'
import { jobsFeed } from '../content/feed'

export const GET: APIRoute = async ({ site, url }) => {
  const origin = site ?? new URL(url.origin)
  const feed = jobsFeed(
    (await jobs()).map((job) => ({ ...job.data, body: job.body ?? '' })),
    origin,
  )
  return new Response(feed, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } })
}
