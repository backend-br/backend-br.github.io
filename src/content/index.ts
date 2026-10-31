import { type CollectionEntry, getCollection } from 'astro:content'

export type RepositoryEntry = CollectionEntry<'repositories'>
export type Challenge = CollectionEntry<'challenges'>
export type JobEntry = CollectionEntry<'jobs'>
export type ProjectEntry = CollectionEntry<'projects'>

export async function repositories(): Promise<readonly RepositoryEntry[]> {
  return (await getCollection('repositories')).sort((a, b) => a.data.order - b.data.order)
}

export async function challenges(): Promise<readonly Challenge[]> {
  return (await getCollection('challenges')).sort((a, b) => a.data.order - b.data.order)
}

export async function jobs(): Promise<readonly JobEntry[]> {
  return (await getCollection('jobs')).sort((a, b) => b.data.opened.localeCompare(a.data.opened))
}

export async function projects(): Promise<readonly ProjectEntry[]> {
  return (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order)
}

export interface Figures {
  readonly jobs: number
  readonly challenges: number
  readonly projects: number
  readonly stars: number
}

export async function figures(): Promise<Figures> {
  const [read, listed, open, registered] = await Promise.all([repositories(), challenges(), jobs(), projects()])
  return {
    jobs: open.length,
    challenges: listed.length,
    projects: registered.length,
    stars: read.reduce((total, repository) => total + repository.data.stars, 0),
  }
}
