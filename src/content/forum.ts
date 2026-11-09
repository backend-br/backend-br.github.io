import { avatarOf, repositoryUrl } from './catalog'
import { plainText } from './markdown'

export const REPOSITORY = 'forum'

export const DISCUSSIONS = 'https://github.com/orgs/backend-br/discussions'

export const NEW_DISCUSSION = `${DISCUSSIONS}/new/choose`

export const PATTERN = `${repositoryUrl(REPOSITORY)}#destaques`

export const HIGHLIGHT = 'destaque'

const UNTIL_LINE = /^[ \t]*Destaque até:.*$/im

const UNTIL = /^[ \t]*Destaque até:[ \t]*(\d{2})\/(\d{2})\/(\d{4})[ \t]*$/im

const VALID_LINE = /^[ \t]*Válida até:.*$/im

const VALID = /^[ \t]*Válida até:[ \t]*(\d{2})\/(\d{2})\/(\d{4})[ \t]*$/im

const LINK = /^[ \t]*Link:[ \t]*(https:\/\/[^\s<>"']+)[ \t]*$/im

const END_OF_DAY = 'T23:59:59-03:00'

export interface Discussion {
  readonly number: number
  readonly title: string
  readonly html_url: string
  readonly created_at: string
  readonly state: string
  readonly comments: number
  readonly answer_chosen_at: string | null
  readonly category: { readonly name: string }
  readonly labels: readonly { readonly name: string }[]
  readonly user: { readonly login: string } | null
  readonly body: string | null
}

export interface Highlight {
  readonly until: string | null
  readonly link: string | null
}

export interface Topic {
  readonly number: number
  readonly title: string
  readonly url: string
  readonly opened: string
  readonly open: boolean
  readonly expires: string | null
  readonly category: string
  readonly comments: number
  readonly answered: boolean
  readonly author: string
  readonly avatar: string
  readonly summary: string
  readonly highlight: Highlight | null
}

function lastDay(body: string, line: RegExp, written: RegExp): string | null | undefined {
  if (!line.test(body)) {
    return null
  }
  const match = written.exec(body)
  if (match === null) {
    return undefined
  }
  const [, day, month, year] = match
  const instant = `${year}-${month}-${day}${END_OF_DAY}`
  const parsed = new Date(`${year}-${month}-${day}T12:00:00Z`)
  const real =
    !Number.isNaN(parsed.getTime()) && parsed.getUTCDate() === Number(day) && parsed.getUTCMonth() + 1 === Number(month)
  return real ? instant : undefined
}

/**
 * Reads the last day a discussion is shown on the site, from the line `Válida até: DD/MM/AAAA`. A day that cannot be
 * read keeps the discussion shown, because hiding it would lose it without a trace.
 */
export function expiryOf(body: string | null): string | null {
  return lastDay(body ?? '', VALID_LINE, VALID) ?? null
}

/**
 * Reads the highlight a discussion asks for. Only a discussion a maintainer labelled `destaque` counts, because a label
 * is the one mark its author cannot set alone. The line `Destaque até: DD/MM/AAAA` says the last day it is shown, and a
 * labelled discussion without that line stays highlighted. A day that cannot be read highlights nothing, so a typo
 * never turns a dated highlight into a permanent one.
 */
export function highlightOf(discussion: Pick<Discussion, 'labels' | 'body'>): Highlight | null {
  const body = discussion.body ?? ''
  const labelled = discussion.labels.some((label) => label.name === HIGHLIGHT)
  const last = lastDay(body, UNTIL_LINE, UNTIL)
  if (!labelled || last === undefined) {
    return null
  }
  return { until: last, link: LINK.exec(body)?.[1] ?? null }
}

export function summaryOf(body: string | null): string {
  return plainText(
    (body ?? '')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(UNTIL_LINE, ' ')
      .replace(VALID_LINE, ' ')
      .replace(LINK, ' ')
      .replace(/^#{1,6}[ \t]+/gm, '')
      .replace(/^[ \t]*[-*+][ \t]+/gm, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\\([[\]])/g, (_, bracket: string) => (bracket === '[' ? '(' : ')'))
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'),
  ).replace(/\\(.)/g, '$1')
}

export function topics(discussions: readonly Discussion[]): Topic[] {
  return discussions
    .map((discussion) => {
      const author = discussion.user?.login ?? 'ghost'
      return {
        number: discussion.number,
        title: discussion.title.trim(),
        url: discussion.html_url,
        opened: discussion.created_at,
        open: discussion.state === 'open',
        expires: expiryOf(discussion.body),
        category: discussion.category.name,
        comments: discussion.comments,
        answered: discussion.answer_chosen_at !== null,
        author,
        avatar: avatarOf(author),
        summary: summaryOf(discussion.body),
        highlight: highlightOf(discussion),
      }
    })
    .sort((a, b) => Date.parse(b.opened) - Date.parse(a.opened))
}

function inDate(instant: string | null, now: Date): boolean {
  return instant === null || Date.parse(instant) >= now.getTime()
}

/**
 * Keeps the highlights still in date, the dated ones first because they end, each group in the order it came.
 */
export function highlighted<T extends Pick<Topic, 'highlight' | 'expires'>>(listed: readonly T[], now: Date): T[] {
  const shown = listed.filter(
    (topic) => topic.highlight !== null && inDate(topic.highlight.until, now) && inDate(topic.expires, now),
  )
  return [
    ...shown.filter((topic) => topic.highlight?.until !== null),
    ...shown.filter((topic) => topic.highlight?.until === null),
  ]
}

/**
 * The topics the forum lists below its highlights: the open ones still in date, newest first. A closed or locked
 * discussion is shown only while it is highlighted, and then among the highlights.
 */
export function listed<T extends Pick<Topic, 'number' | 'open' | 'expires'>>(
  all: readonly T[],
  shown: readonly Pick<Topic, 'number'>[],
  now: Date,
): T[] {
  const featured = new Set(shown.map((topic) => topic.number))
  return all.filter((topic) => topic.open && !featured.has(topic.number) && inDate(topic.expires, now))
}

export function dated<T extends Pick<Topic, 'highlight'>>(shown: readonly T[]): T[] {
  return shown.filter((topic) => topic.highlight?.until !== null && topic.highlight?.until !== undefined)
}
