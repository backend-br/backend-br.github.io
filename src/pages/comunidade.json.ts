import type { APIRoute } from 'astro'
import { figures } from '../content'
import { TEXT } from '../content/site'

export const GET: APIRoute = async () => {
  const read = await figures()
  const keys = TEXT.home.response.keys
  const body = {
    [keys.jobs]: read.jobs,
    [keys.challenges]: read.challenges,
    [keys.projects]: read.projects,
    [keys.stars]: read.stars,
  }
  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}
