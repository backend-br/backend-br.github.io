import type { APIRoute } from 'astro'
import { challenges, openJobs, projects, repositories, repositoryLede, tutorials } from '../content'
import { rawUrl } from '../content/catalog'
import { REPOSITORY as CHALLENGES } from '../content/challenges'
import { REPOSITORY as JOBS } from '../content/jobs'
import { REPOSITORY as PROJECTS } from '../content/projects'
import { SITE, TEXT } from '../content/site'
import { REPOSITORY as TALENTS } from '../content/talents'

export const GET: APIRoute = async ({ site, url }) => {
  const origin = site ?? new URL(url.origin)
  const page = (path: string): string => new URL(path, origin).href
  const [challengesLede, jobsLede, talentsLede, projectsLede] = await Promise.all([
    repositoryLede(CHALLENGES, TEXT.challenges.lede),
    repositoryLede(JOBS, TEXT.jobs.lede),
    repositoryLede(TALENTS, TEXT.talents.lede),
    repositoryLede(PROJECTS, TEXT.projects.lede),
  ])
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${TEXT.home.lede}`,
    '',
    '## Páginas',
    '',
    `- [${TEXT.challenges.headline}](${page('/desafios/')}): ${challengesLede}`,
    `- [${TEXT.jobs.headline}](${page('/vagas/')}): ${jobsLede}`,
    `- [${TEXT.talents.headline}](${page('/talentos/')}): ${talentsLede}`,
    `- [${TEXT.projects.headline}](${page('/projetos/')}): ${projectsLede}`,
    `- [${TEXT.tutorials.headline}](${page('/tutoriais/')}): ${TEXT.tutorials.lede}`,
    '',
    '## Dados',
    '',
    `- [${TEXT.home.response.label}](${page(TEXT.home.response.path)}): JSON com ${Object.values(TEXT.home.response.keys).join(', ')}.`,
    `- [${TEXT.jobs.feed}](${page(TEXT.jobs.feedPath)}): JSON com as vagas abertas.`,
    `- [${TEXT.jobs.rss}](${page(TEXT.jobs.rssPath)}): RSS com as 50 vagas abertas mais recentes.`,
    `- [${TEXT.talents.feed}](${page(TEXT.talents.feedPath)}): JSON com os perfis divulgados.`,
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
    ...(await openJobs()).map(
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
    '## Tutoriais de instalação',
    '',
    ...(await tutorials()).map(
      (guide) =>
        `- [${guide.data.title}](${page(`/tutoriais/${guide.data.tool}/${guide.data.systemSlug}/`)}): ${guide.data.summary}`,
    ),
    '',
  ]
  return new Response(lines.join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
