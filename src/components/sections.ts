import { TEXT } from '../content/site'
import type { IconName } from './icons'

export interface Section {
  readonly path: string
  readonly label: string
  readonly icon: IconName
}

export const HOME: Section = { path: '/', label: TEXT.nav.home, icon: 'home' }

export const SECTIONS: readonly Section[] = [
  { path: '/desafios/', label: TEXT.challenges.title, icon: 'code' },
  { path: '/vagas/', label: TEXT.jobs.title, icon: 'briefcase' },
  { path: '/talentos/', label: TEXT.talents.title, icon: 'users' },
  { path: '/projetos/', label: TEXT.projects.shortTitle, icon: 'star' },
  { path: '/tutoriais/', label: TEXT.tutorials.title, icon: 'terminal' },
  { path: '/forum/', label: TEXT.forum.title, icon: 'message' },
]

export function sectionAt(path: string): Section {
  const found = SECTIONS.find((section) => section.path === path)
  if (found === undefined) {
    throw new Error(`No section lives at ${path}.`)
  }
  return found
}

export function isCurrent(section: Section, pathname: string): boolean {
  return section.path === '/' ? pathname === '/' : pathname.startsWith(section.path)
}
