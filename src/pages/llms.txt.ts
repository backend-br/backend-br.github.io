import type { APIRoute } from 'astro'
import { challenges, jobs, projects, repositories } from '../content'
import { rawUrl } from '../content/catalog'
import { REPOSITORY as CHALLENGES } from '../content/challenges'
import { SITE, TEXT } from '../content/site'

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
    ...(await challenges()).map((challenge) => {
      const first = challenge.data.solutions.find((solution) => solution.first)
      const solved = `${TEXT.challenges.solutions(challenge.data.solutionCount)}.${first ? ` ${TEXT.challenges.first}: ${first.repository}` : ''}`
      return `- [${challenge.data.title}](${page(`/desafios/${challenge.data.slug}/`)}): ${challenge.data.summary} Enunciado: ${rawUrl(CHALLENGES, `${challenge.data.slug}/PROBLEM.md`)} ${solved}`
    }),
    '',
    '## Vagas abertas',
    '',
    ...(await jobs()).map(
      (job) =>
        `- [${job.data.title}](${page(`/vagas/${job.data.number}/`)}): aberta em ${job.data.opened.slice(0, 10)}.`,
    ),
    '',
    '## Projetos open-source',
    '',
    ...(await projects()).map(
      (project) =>
        `- [${project.data.name}](${project.data.url}): ${[project.data.language, TEXT.home.stars(project.data.stars)].filter(Boolean).join(', ')}`,
    ),
    '',
  ]
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
