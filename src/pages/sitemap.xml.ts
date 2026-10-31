import type { APIRoute } from 'astro'
import { challenges, jobs } from '../content'

export const GET: APIRoute = async ({ site, url }) => {
  const origin = site ?? new URL(url.origin)
  const openings = await jobs()
  const [newest] = openings
  const entries = [
    { path: '/' },
    { path: '/desafios/' },
    ...(await challenges()).map((challenge) => ({ path: `/desafios/${challenge.data.slug}/` })),
    { path: '/vagas/', changed: newest?.data.opened.slice(0, 10) },
    ...openings.map((job) => ({ path: `/vagas/${job.data.number}/`, changed: job.data.opened.slice(0, 10) })),
    { path: '/projetos/' },
  ]
  const document = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      (entry) =>
        `  <url>\n    <loc>${new URL(entry.path, origin).href}</loc>\n${entry.changed ? `    <lastmod>${entry.changed}</lastmod>\n` : ''}  </url>`,
    ),
    '</urlset>',
    '',
  ].join('\n')
  return new Response(document, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
