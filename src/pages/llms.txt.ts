import type { APIRoute } from 'astro'
import { challenges, repositories } from '../content'
import { rawUrl } from '../content/catalog'
import { REPOSITORY as CHALLENGES } from '../content/challenges'
import { SITE, TEXT } from '../content/site'

/**
 * The index of the site for language models, in the llms.txt format: what Back-End Brasil is, its pages,
 * its figures as JSON, its repositories, and every challenge with its page and the statement it is drawn
 * from, as plain Markdown.
 */
export const GET: APIRoute = async ({ site, url }) => {
  const origin = site ?? new URL(url.origin)
  const page = (path: string): string => new URL(path, origin).href
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${TEXT.home.lede}`,
    '',
    '## Páginas',
    '',
    `- [${TEXT.challenges.headline}](${page('/desafios/')}): ${TEXT.challenges.lede}`,
    `- [${TEXT.jobs.headline}](${page('/vagas/')}): ${TEXT.jobs.lede}`,
    `- [${TEXT.projects.headline}](${page('/projetos/')}): ${TEXT.projects.lede}`,
    '',
    '## Dados',
    '',
    `- [${TEXT.home.response.label}](${page(TEXT.home.response.path)}): JSON com ${Object.values(TEXT.home.response.keys).join(', ')}.`,
    '',
    '## Repositórios',
    '',
    ...(await repositories()).map(
      (repository) => `- [backend-br/${repository.data.name}](${repository.data.url}): ${repository.data.description}`,
    ),
    '',
    '## Desafios',
    '',
    ...(await challenges()).map(
      (challenge) =>
        `- [${challenge.data.title}](${page(`/desafios/${challenge.data.slug}/`)}): ${challenge.data.summary} Enunciado: ${rawUrl(CHALLENGES, `${challenge.data.slug}/PROBLEM.md`)}`,
    ),
    '',
  ]
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
