import type { APIRoute } from 'astro'
import { talents } from '../content'
import { anchor } from '../content/talents'

export const GET: APIRoute = async ({ site, url }) => {
  const origin = site ?? new URL(url.origin)
  const body = (await talents()).map(({ data }) => ({
    numero: data.number,
    nome: data.name,
    cargo: data.role,
    localizacao: data.location,
    nivel: data.level,
    regime: data.contract,
    modelo: data.modality,
    tecnologias: data.stack,
    linkedin: data.linkedin,
    github: data.github,
    portfolio: data.portfolio,
    perfil: data.url,
    pagina: new URL(`/talentos/#${anchor(data.number)}`, origin).href,
    atualizado: data.updated,
  }))
  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}
