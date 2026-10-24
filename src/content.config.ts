/**
 * The content of the site, read from the repositories of Back-End Brasil on GitHub when the site is
 * built. Nothing is written here by hand: a repository that changes changes the site on the next build.
 */
import { unified } from '@astrojs/markdown-remark'
import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { CATALOG } from './content/catalog'
import { REPOSITORY as CHALLENGES, byLanguage, challengeIndex, problem, solutions } from './content/challenges'
import { REPOSITORY as JOBS, openings } from './content/jobs'
import { rehypeLineBreaks, rehypeOutline, rehypeUntrusted, SHIKI } from './content/markdown'
import { REPOSITORY as PROJECTS, projects as projectList } from './content/projects'
import { catalogued } from './content/repositories'
import { file, labels, openIssues, organizationRepositories } from './content/sources'

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
          return { entry, statement: problem(entry.slug, statement), solutions: solutions(list) }
        }),
      )
      store.clear()
      for (const [order, { entry, statement, solutions: sent }] of read.entries()) {
        store.set({
          id: entry.slug,
          data: {
            slug: entry.slug,
            title: statement.title,
            summary: statement.summary,
            order,
            solutionCount: sent.length,
            languages: byLanguage(sent).map((group) => ({ ...group, repositories: [...group.repositories] })),
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
  }),
})

const jobs = defineCollection({
  loader: {
    name: 'backend-br-jobs',
    load: async ({ store, logger }) => {
      const [issues, catalog] = await Promise.all([openIssues(JOBS), labels(JOBS)])
      const found = openings(issues, catalog)
      // Anyone can open an issue, so its text is rendered as untrusted Markdown, never as the HTML it holds.
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
      logger.info(`Read ${found.length} job openings.`)
    },
  },
  schema: z.object({
    number: z.number(),
    title: z.string(),
    url: z.string(),
    opened: z.string(),
    modality: z.array(z.string()),
    level: z.array(z.string()),
    contract: z.array(z.string()),
    stack: z.array(z.string()),
    author: z.string(),
    avatar: z.string(),
  }),
})

const projects = defineCollection({
  loader: {
    name: 'backend-br-projects',
    load: async ({ store, logger }) => {
      const found = projectList(await file(PROJECTS, 'README.md'))
      if (found.length === 0) {
        throw new Error(`The README of ${PROJECTS} lists no project.`)
      }
      store.clear()
      for (const [order, project] of found.entries()) {
        store.set({ id: `${order}-${project.source}`, data: { ...project, links: [...project.links], order } })
      }
      logger.info(`Read ${found.length} projects.`)
    },
  },
  schema: z.object({
    name: z.string(),
    url: z.string(),
    source: z.string(),
    language: z.string(),
    links: z.array(z.object({ label: z.string(), url: z.string() })),
    order: z.number(),
  }),
})

export const collections = { repositories, challenges, jobs, projects }
