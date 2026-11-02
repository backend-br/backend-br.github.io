import { unified } from '@astrojs/markdown-remark'
import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { CATALOG } from './content/catalog'
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
  githubHome,
  plainDescription,
  REPOSITORY as PROJECTS,
  projects as projectList,
} from './content/projects'
import { catalogued } from './content/repositories'
import { REPOSITORY as TALENTS, talents as sharedTalents } from './content/talents'
import {
  accountFacts,
  closedIssues,
  file,
  labels,
  openIssues,
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

const projects = defineCollection({
  loader: {
    name: 'backend-br-projects',
    load: async ({ store, logger }) => {
      const found = projectList(await file(PROJECTS, 'README.md'))
      if (found.length === 0) {
        throw new Error(`The README of ${PROJECTS} lists no project.`)
      }
      const starred: { project: (typeof found)[number] & { description: string }; stars: number | null }[] = []
      for (let start = 0; start < found.length; start += STAR_BATCH) {
        const batch = found.slice(start, start + STAR_BATCH)
        starred.push(
          ...(await Promise.all(
            batch.map(async (project) => {
              const home = githubHome(project.url)
              const facts =
                home === null
                  ? null
                  : home.kind === 'repository'
                    ? await repositoryFacts(home.owner, home.name)
                    : await accountFacts(home.owner)
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

export const collections = { repositories, challenges, jobs, projects, talents }
