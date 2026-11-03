import { unified } from '@astrojs/markdown-remark'
import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { CATALOG, ORGANIZATION } from './content/catalog'
import {
  REPOSITORY as CHALLENGES,
  byLanguage,
  challengeIndex,
  firstSolution,
  problem,
  solutionCards,
  solutions,
} from './content/challenges'
import { REPOSITORY as JOBS, openings, shortlist } from './content/jobs'
import { rehypeLineBreaks, rehypeOutline, rehypeUntrusted, SHIKI } from './content/markdown'
import {
  byStars,
  type GitHubHome,
  githubHome,
  plainDescription,
  REPOSITORY as PROJECTS,
  projects as projectList,
  withOrganization,
} from './content/projects'
import { catalogued } from './content/repositories'
import { REPOSITORY as TALENTS, talents as sharedTalents } from './content/talents'
import {
  isToolIndex,
  systemSlug,
  toolIndex,
  toolIndexPath,
  toolPage,
  toolReadmeOf,
  toolSection,
  tutorialPage,
  withSiteLinks,
  REPOSITORY as TUTORIALS,
  tutorial,
} from './content/tutorials'
import {
  accountFacts,
  closedIssues,
  file,
  type GitHubFacts,
  labels,
  openIssues,
  optionalFile,
  organizationRepositories,
  repositoryFacts,
} from './content/sources'

const repositories = defineCollection({
  loader: {
    name: 'backend-br-repositories',
    load: async ({ store, logger }) => {
      const { repositories: found, missing } = catalogued(CATALOG, await organizationRepositories())
      if (missing.length > 0) {
        throw new Error(`The organization lists no repository named ${missing.join(', ')}.`)
      }
      store.clear()
      for (const [order, repository] of found.entries()) {
        store.set({ id: repository.name, data: { ...repository, order } })
      }
      logger.info(`Read ${found.length} repositories.`)
    },
  },
  schema: z.object({
    name: z.string(),
    description: z.string(),
    url: z.string(),
    stars: z.number(),
    page: z.object({ path: z.string(), label: z.string() }).nullable(),
    order: z.number(),
  }),
})

const challenges = defineCollection({
  loader: {
    name: 'backend-br-challenges',
    load: async ({ store, renderMarkdown, logger }) => {
      const index = challengeIndex(await file(CHALLENGES, 'README.md'))
      if (index.length === 0) {
        throw new Error(`The README of ${CHALLENGES} lists no challenge.`)
      }
      const read = await Promise.all(
        index.map(async (entry) => {
          const [statement, list] = await Promise.all([
            file(CHALLENGES, `${entry.slug}/PROBLEM.md`),
            file(CHALLENGES, `${entry.slug}/SOLUTIONS.md`),
          ])
          const sent = solutions(list)
          return {
            entry,
            statement: problem(entry.slug, statement),
            solutions: sent,
            cards: solutionCards(sent, firstSolution(list)),
          }
        }),
      )
      store.clear()
      for (const [order, { entry, statement, solutions: sent, cards }] of read.entries()) {
        store.set({
          id: entry.slug,
          data: {
            slug: entry.slug,
            title: statement.title,
            summary: statement.summary,
            order,
            solutionCount: sent.length,
            languages: byLanguage(sent).map((group) => ({ ...group, repositories: [...group.repositories] })),
            solutions: cards,
          },
          body: statement.body,
          rendered: await renderMarkdown(statement.body),
        })
      }
      logger.info(`Read ${read.length} challenges.`)
    },
  },
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    order: z.number(),
    solutionCount: z.number(),
    languages: z.array(z.object({ language: z.string(), repositories: z.array(z.string()) })),
    solutions: z.array(
      z.object({
        language: z.string(),
        repository: z.string(),
        owner: z.string(),
        name: z.string(),
        first: z.boolean(),
      }),
    ),
  }),
})

const jobs = defineCollection({
  loader: {
    name: 'backend-br-jobs',
    load: async ({ store, logger }) => {
      const [open, closed, catalog] = await Promise.all([openIssues(JOBS), closedIssues(JOBS), labels(JOBS)])
      const found = shortlist(openings([...open, ...closed], catalog))
      const renderer = await unified({
        rehypePlugins: [rehypeUntrusted, rehypeOutline, rehypeLineBreaks],
      }).createRenderer({
        shikiConfig: SHIKI,
      })
      store.clear()
      for (const { body, ...job } of found) {
        const { code, metadata } = await renderer.render(body)
        store.set({ id: String(job.number), data: job, body, rendered: { html: code, metadata } })
      }
      const listedOpen = found.filter((job) => job.open).length
      logger.info(`Read ${listedOpen} open jobs and ${found.length - listedOpen} recently closed ones.`)
    },
  },
  schema: z.object({
    number: z.number(),
    title: z.string(),
    url: z.string(),
    opened: z.string(),
    open: z.boolean(),
    modality: z.array(z.string()),
    level: z.array(z.string()),
    contract: z.array(z.string()),
    stack: z.array(z.string()),
    author: z.string(),
    avatar: z.string(),
  }),
})

const talents = defineCollection({
  loader: {
    name: 'backend-br-talents',
    load: async ({ store, logger }) => {
      const [issues, catalog] = await Promise.all([openIssues(TALENTS), labels(TALENTS)])
      const found = sharedTalents(issues, catalog)
      store.clear()
      for (const talent of found) {
        store.set({ id: String(talent.number), data: { ...talent } })
      }
      logger.info(`Read ${found.length} shared profiles.`)
    },
  },
  schema: z.object({
    number: z.number(),
    name: z.string(),
    role: z.string(),
    about: z.string(),
    location: z.string(),
    url: z.string(),
    updated: z.string(),
    modality: z.array(z.string()),
    level: z.array(z.string()),
    contract: z.array(z.string()),
    stack: z.array(z.string()),
    linkedin: z.string().nullable(),
    github: z.string().nullable(),
    portfolio: z.string().nullable(),
    login: z.string(),
    avatar: z.string(),
  }),
})

const STAR_BATCH = 10

/** Reads the stars and the description of a project, taking those of the organization from its listing. */
function factsOf(home: GitHubHome | null, listed: ReadonlyMap<string, GitHubFacts>): Promise<GitHubFacts | null> {
  if (home === null) {
    return Promise.resolve(null)
  }
  if (home.kind === 'account') {
    return accountFacts(home.owner)
  }
  const own = home.owner.toLowerCase() === ORGANIZATION ? listed.get(home.name.toLowerCase()) : undefined
  return own === undefined ? repositoryFacts(home.owner, home.name) : Promise.resolve(own)
}

const projects = defineCollection({
  loader: {
    name: 'backend-br-projects',
    load: async ({ store, logger }) => {
      const listed = projectList(await file(PROJECTS, 'README.md'))
      if (listed.length === 0) {
        throw new Error(`The README of ${PROJECTS} lists no project.`)
      }
      const organization = await organizationRepositories()
      const found = withOrganization(listed, organization)
      const listedFacts = new Map(
        organization.map((repository): [string, GitHubFacts] => [
          repository.name.toLowerCase(),
          { stars: repository.stargazers_count, description: (repository.description ?? '').trim() },
        ]),
      )
      const starred: { project: (typeof found)[number] & { description: string }; stars: number | null }[] = []
      for (let start = 0; start < found.length; start += STAR_BATCH) {
        const batch = found.slice(start, start + STAR_BATCH)
        starred.push(
          ...(await Promise.all(
            batch.map(async (project) => {
              const facts = await factsOf(githubHome(project.url), listedFacts)
              return {
                project: { ...project, description: plainDescription(facts?.description ?? '') },
                stars: facts?.stars ?? null,
              }
            }),
          )),
        )
      }
      const ranked = byStars(starred)
      store.clear()
      for (const [order, { name, url, source, language, description, stars }] of ranked.entries()) {
        store.set({ id: `${order}-${source}`, data: { name, url, source, language, description, stars, order } })
      }
      const left = found.length - ranked.length
      logger.info(`Read ${ranked.length} projects${left > 0 ? `, leaving out ${left} with nothing on GitHub` : ''}.`)
    },
  },
  schema: z.object({
    name: z.string(),
    url: z.string(),
    source: z.string(),
    language: z.string(),
    description: z.string(),
    stars: z.number(),
    order: z.number(),
  }),
})

const tutorials = defineCollection({
  loader: {
    name: 'backend-br-tutorials',
    load: async ({ store, renderMarkdown, logger }) => {
      const tools = toolIndex(await file(TUTORIALS, 'README.md'))
      if (tools.length === 0) {
        throw new Error(`The README of ${TUTORIALS} lists no tutorial.`)
      }
      const read = await Promise.all(
        tools.map(async (tool) => {
          const indexes = [
            ...new Set([...tool.paths.filter(isToolIndex).map(toolIndexPath), toolReadmeOf(tool.paths[0] ?? '')]),
          ]
          const pages = (
            await Promise.all(
              indexes.map(async (path) => {
                const markdown = await optionalFile(TUTORIALS, path)
                return markdown === null ? [] : [toolPage(path, markdown)]
              }),
            )
          ).flat()
          const paths = [
            ...new Set([...tool.paths.filter((path) => !isToolIndex(path)), ...pages.flatMap((page) => page.paths)]),
          ]
          const guides = await Promise.all(
            paths.map(async (path) => ({ path, guide: tutorial(path, await file(TUTORIALS, path)) })),
          )
          return { tool, summary: pages.find((page) => page.summary !== '')?.summary ?? '', guides }
        }),
      )
      const routes = new Map<string, string>(
        read.flatMap(({ tool, guides }) => [
          [toolReadmeOf(guides[0]?.path ?? '').replace(/\/README\.md$/, ''), toolSection(tool.slug)],
          ...guides.map(({ path, guide }): [string, string] => [path, tutorialPage(tool.slug, guide.system)]),
        ]),
      )
      store.clear()
      let count = 0
      for (const [toolOrder, { tool, summary, guides }] of read.entries()) {
        for (const [order, { path, guide }] of guides.entries()) {
          store.set({
            id: `${tool.slug}/${systemSlug(guide.system)}`,
            data: {
              tool: tool.slug,
              toolName: tool.name,
              toolSummary: summary || guide.summary,
              category: tool.category,
              toolOrder,
              order,
              system: guide.system,
              systemSlug: systemSlug(guide.system),
              title: guide.title,
              summary: guide.summary,
              path,
            },
            body: withSiteLinks(guide.body, routes),
            rendered: await renderMarkdown(withSiteLinks(guide.body, routes)),
          })
          count++
        }
      }
      logger.info(`Read ${count} tutorials of ${read.length} tools.`)
    },
  },
  schema: z.object({
    tool: z.string(),
    toolName: z.string(),
    toolSummary: z.string(),
    category: z.string(),
    toolOrder: z.number(),
    order: z.number(),
    system: z.string(),
    systemSlug: z.string(),
    title: z.string(),
    summary: z.string(),
    path: z.string(),
  }),
})

export const collections = { repositories, challenges, jobs, projects, talents, tutorials }
