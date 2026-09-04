/**
 * Local-first project store using plain localStorage + React state.
 * ponytail: no zustand dep needed — localStorage handles persistence,
 * a custom hook + storage events handle cross-tab sync.
 */
'use client'

import { useCallback, useEffect, useState } from 'react'
import { SKILL_MANIFESTS } from './flow-types'

/** Phase 8 — pinned skill versions per project. */
export type PinnedSkill = {
  skillId: string
  pinnedVersion: string
  source: 'builtin' | 'local' | 'marketplace'
}

export type Project = {
  id: string
  name: string
  type: string
  nodeCount: number
  updatedAt: number
  /** Phase 8 — skill versions active when this project was created/last updated.
   *  Updates must not silently change old projects. */
  installedSkills?: PinnedSkill[]
}

const PROJECTS_KEY = 'sf:projects'

function readProjects(): Project[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) ?? '[]') as Project[]
  } catch {
    return []
  }
}

function writeProjects(projects: Project[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  // Notify same-tab listeners
  window.dispatchEvent(new CustomEvent('sf:projects:change'))
}

export function generateProjectId() {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function createProject(name: string, type: string): Project {
  // Phase 8: pin current built-in skill versions at project creation
  const installedSkills: PinnedSkill[] = Object.values(SKILL_MANIFESTS).map((m) => ({
    skillId: m.skillId,
    pinnedVersion: m.version,
    source: m.source,
  }))
  const project: Project = {
    id: generateProjectId(),
    name: name.trim(),
    type,
    nodeCount: 0,
    updatedAt: Date.now(),
    installedSkills,
  }
  const projects = readProjects()
  writeProjects([project, ...projects])
  return project
}

export function updateProject(id: string, patch: Partial<Omit<Project, 'id'>>) {
  const projects = readProjects().map((p) =>
    p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p,
  )
  writeProjects(projects)
}

export function deleteProject(id: string) {
  writeProjects(readProjects().filter((p) => p.id !== id))
  localStorage.removeItem(`sf:nodes:${id}`)
  localStorage.removeItem(`sf:edges:${id}`)
}

/** React hook — re-renders on any project mutation in this tab. */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(readProjects)

  useEffect(() => {
    const sync = () => setProjects(readProjects())
    window.addEventListener('sf:projects:change', sync)
    window.addEventListener('storage', sync) // cross-tab
    return () => {
      window.removeEventListener('sf:projects:change', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const create = useCallback((name: string, type: string) => createProject(name, type), [])
  const update = useCallback((id: string, patch: Partial<Omit<Project, 'id'>>) => {
    updateProject(id, patch)
    setProjects(readProjects())
  }, [])
  const remove = useCallback((id: string) => {
    deleteProject(id)
    setProjects(readProjects())
  }, [])

  return { projects, createProject: create, updateProject: update, deleteProject: remove }
}

/* ------------------------------------------------------------------ */
/* Per-project node / edge persistence                                 */
/* ------------------------------------------------------------------ */

export function loadProjectGraph(projectId: string) {
  if (typeof window === 'undefined') return null
  try {
    const nodes = localStorage.getItem(`sf:nodes:${projectId}`)
    const edges = localStorage.getItem(`sf:edges:${projectId}`)
    if (!nodes) return null
    return { nodes: JSON.parse(nodes), edges: edges ? JSON.parse(edges) : [] }
  } catch {
    return null
  }
}

export function saveProjectGraph(projectId: string, nodes: unknown[], edges: unknown[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`sf:nodes:${projectId}`, JSON.stringify(nodes))
  localStorage.setItem(`sf:edges:${projectId}`, JSON.stringify(edges))
}

/**
 * Phase 8 — pin a skill version on an existing project.
 * Idempotent: replaces the existing entry for that skillId.
 */
export function pinSkillOnProject(projectId: string, skill: PinnedSkill) {
  const projects = readProjects().map((p) => {
    if (p.id !== projectId) return p
    const others = (p.installedSkills ?? []).filter((s) => s.skillId !== skill.skillId)
    return { ...p, installedSkills: [...others, skill], updatedAt: Date.now() }
  })
  writeProjects(projects)
}

/* ------------------------------------------------------------------ */
/* Phase 6 — Series / episode memory (cross-project persistence)      */
/* ------------------------------------------------------------------ */

const SERIES_KEY_PREFIX = 'sf:series:'

export type EpisodeMemoryRecord = {
  episodeNumber: number
  episodeTitle: string
  projectId: string             // which ScriptFlora project this episode lives in
  characterSnapshots: Array<{
    characterId: string
    characterName: string
    exitState: string
    entryState: string
    wardrobeAtEnd: string
  }>
  revealedFacts: string
  openThreads: string
  resolvedThreads: string
  savedAt: string               // ISO timestamp
}

export type SeriesMemory = {
  seriesId: string
  seriesTitle: string
  episodes: EpisodeMemoryRecord[]
  lastUpdated: string
}

function seriesKey(seriesId: string) { return `${SERIES_KEY_PREFIX}${seriesId}` }

export function loadSeriesMemory(seriesId: string): SeriesMemory | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(seriesKey(seriesId))
    return raw ? (JSON.parse(raw) as SeriesMemory) : null
  } catch {
    return null
  }
}

export function saveEpisodeMemory(seriesId: string, seriesTitle: string, record: EpisodeMemoryRecord): void {
  if (typeof window === 'undefined') return
  const existing = loadSeriesMemory(seriesId) ?? { seriesId, seriesTitle, episodes: [], lastUpdated: '' }
  const others = existing.episodes.filter((e) => e.episodeNumber !== record.episodeNumber)
  const updated: SeriesMemory = {
    ...existing,
    seriesTitle,
    episodes: [...others, record].sort((a, b) => a.episodeNumber - b.episodeNumber),
    lastUpdated: new Date().toISOString(),
  }
  localStorage.setItem(seriesKey(seriesId), JSON.stringify(updated))
  window.dispatchEvent(new CustomEvent('sf:series:change', { detail: { seriesId } }))
}

export function getEpisodeHandoff(seriesId: string, fromEpisode: number): EpisodeMemoryRecord | null {
  return loadSeriesMemory(seriesId)?.episodes.find((e) => e.episodeNumber === fromEpisode) ?? null
}

export function listSeriesIds(): string[] {
  if (typeof window === 'undefined') return []
  return Object.keys(localStorage)
    .filter((k) => k.startsWith(SERIES_KEY_PREFIX))
    .map((k) => k.slice(SERIES_KEY_PREFIX.length))
}
