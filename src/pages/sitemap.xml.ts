import type { APIRoute } from 'astro'
import { challenges, jobs } from '../content'

/**
 * The addresses the site asks to have indexed: the home, the three sections and every challenge. The
 * search page and the page of a missing address declare themselves out of the index, so they stay out of
 * here too.
 *
 * A date of last change is given only where the site knows it: the list of openings changes when one is
 * opened, so it carries the day of the newest. The repositories serve their files with no date, so the
 * other pages carry none rather than a guess.
 */
export const GET: APIRoute = async ({ site, url }) => {
  const origin = site ?? new URL(url.origin)
  const [newest] = await jobs()
  const entries = [
    { path: '/' },
    { path: '/desafios/' },
    ...(await challenges()).map((challenge) => ({ path: `/desafios/${challenge.data.slug}/` })),
    { path: '/vagas/', changed: newest?.data.opened.slice(0, 10) },
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
