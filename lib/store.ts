/**
 * Local-first project store using plain localStorage + React state.
 * ponytail: no zustand dep needed — localStorage handles persistence,
 * a custom hook + storage events handle cross-tab sync.
 */
'use client'

import { useCallback, useEffect, useState } from 'react'

export type Project = {
  id: string
  name: string
  type: string
  nodeCount: number
  updatedAt: number
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
  const project: Project = {
    id: generateProjectId(),
    name: name.trim(),
    type,
    nodeCount: 0,
    updatedAt: Date.now(),
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
