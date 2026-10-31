import type { APIRoute } from 'astro'
import { jobs } from '../content'

export const GET: APIRoute = async ({ site, url }) => {
  const origin = site ?? new URL(url.origin)
  const body = (await jobs()).map(({ data }) => ({
    numero: data.number,
    titulo: data.title,
    nivel: data.level,
    regime: data.contract,
    modelo: data.modality,
    tecnologias: data.stack,
    autor: data.author,
    issue: data.url,
    pagina: new URL(`/vagas/${data.number}/`, origin).href,
    aberta: data.opened,
  }))
  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}
