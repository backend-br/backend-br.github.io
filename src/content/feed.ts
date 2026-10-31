import { plainText } from './markdown'
import { formFields } from './posting'
import { excerpt, SITE, TEXT } from './site'

export interface FeedJob {
  readonly number: number
  readonly title: string
  readonly opened: string
  readonly modality: readonly string[]
  readonly level: readonly string[]
  readonly contract: readonly string[]
  readonly stack: readonly string[]
  readonly body: string
}

const LIMIT = 50

const ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

export function escapeXml(text: string): string {
  return text
    .replace(/\p{Cc}/gu, (control) => ('\t\n\r'.includes(control) ? control : ''))
    .replace(/[&<>"']/g, (entity) => ENTITIES[entity] ?? entity)
}

export function withoutMarkup(text: string): string {
  return text.replace(/<[^<>]*>/g, ' ').replace(/[<>]/g, ' ')
}

function summary(job: FeedJob): string {
  const text = plainText(
    withoutMarkup(formFields(job.body).description ?? job.body).replace(/^\s*(#+|[-*_]{3,})\s*/gm, ''),
  )
  return excerpt(text || job.title, 280)
}

function item(job: FeedJob, origin: string | URL): string {
  const link = new URL(`/vagas/${job.number}/`, origin).href
  const categories = [...job.level, ...job.contract, ...job.modality, ...job.stack]
  return [
    '    <item>',
    `      <title>${escapeXml(job.title)}</title>`,
    `      <link>${link}</link>`,
    `      <guid isPermaLink="true">${link}</guid>`,
    `      <pubDate>${new Date(job.opened).toUTCString()}</pubDate>`,
    `      <description>${escapeXml(summary(job))}</description>`,
    ...categories.map((category) => `      <category>${escapeXml(category)}</category>`),
    '    </item>',
  ].join('\n')
}

export function jobsFeed(jobs: readonly FeedJob[], origin: string | URL): string {
  const listed = [...jobs].sort((a, b) => b.opened.localeCompare(a.opened)).slice(0, LIMIT)
  const page = new URL('/vagas/', origin).href
  const self = new URL(TEXT.jobs.rssPath, origin).href
  const updated = listed[0]?.opened
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(`${TEXT.jobs.headline} · ${SITE.name}`)}</title>`,
    `    <link>${page}</link>`,
    `    <description>${escapeXml(TEXT.jobs.lede)}</description>`,
    '    <language>pt-BR</language>',
    `    <atom:link href="${self}" rel="self" type="application/rss+xml" />`,
    ...(updated ? [`    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>`] : []),
    ...listed.map((job) => item(job, origin)),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}
