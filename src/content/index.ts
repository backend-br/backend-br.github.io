import { type CollectionEntry, getCollection } from 'astro:content'
import { byListing } from './jobs'

export type RepositoryEntry = CollectionEntry<'repositories'>
export type Challenge = CollectionEntry<'challenges'>
export type JobEntry = CollectionEntry<'jobs'>
export type ProjectEntry = CollectionEntry<'projects'>
export type TalentEntry = CollectionEntry<'talents'>
export type TutorialEntry = CollectionEntry<'tutorials'>

export async function repositories(): Promise<readonly RepositoryEntry[]> {
  return (await getCollection('repositories')).sort((a, b) => a.data.order - b.data.order)
}

export async function repositoryLede(name: string, fallback: string): Promise<string> {
  const found = (await repositories()).find((repository) => repository.data.name === name)
  return found?.data.description || fallback
}

export async function challenges(): Promise<readonly Challenge[]> {
  return (await getCollection('challenges')).sort((a, b) => a.data.order - b.data.order)
}

export async function jobs(): Promise<readonly JobEntry[]> {
  return (await getCollection('jobs')).sort((a, b) => byListing(a.data, b.data))
}

export async function openJobs(): Promise<readonly JobEntry[]> {
  return (await jobs()).filter((job) => job.data.open)
}

export async function talents(): Promise<readonly TalentEntry[]> {
  return (await getCollection('talents')).sort(
    (a, b) => b.data.updated.localeCompare(a.data.updated) || a.data.number - b.data.number,
  )
}

export async function tutorials(): Promise<readonly TutorialEntry[]> {
  return (await getCollection('tutorials')).sort(
    (a, b) => a.data.toolOrder - b.data.toolOrder || a.data.order - b.data.order,
  )
}

export async function projects(): Promise<readonly ProjectEntry[]> {
  return (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order)
}

export interface Figures {
  readonly jobs: number
  readonly challenges: number
  readonly talents: number
  readonly projects: number
  readonly tutorials: number
  readonly stars: number
}

export async function figures(): Promise<Figures> {
  const [read, listed, open, shared, registered, guides] = await Promise.all([
    repositories(),
    challenges(),
    openJobs(),
    talents(),
    projects(),
    tutorials(),
  ])
  return {
    jobs: open.length,
    challenges: listed.length,
    talents: shared.length,
    projects: registered.length,
    tutorials: guides.length,
    stars: read.reduce((total, repository) => total + repository.data.stars, 0),
  }
}
