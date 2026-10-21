import type { APIRoute } from 'astro'

/** The rules for crawlers. The site is served at the root of its domain, where crawlers read this file. */
export const GET: APIRoute = ({ site, url }) => {
  const sitemap = new URL('/sitemap.xml', site ?? url.origin).href
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
