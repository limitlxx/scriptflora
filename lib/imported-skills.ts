'use client'

/**
 * Persists user-imported skill markdown files to localStorage.
 * Keyed by a slug derived from the filename.
 */

const LS_KEY = 'sf:imported-skills'

export type ImportedSkill = {
  id: string       // slug e.g. "custom:my-skill"
  name: string     // display name
  markdown: string // full file content
}

export function loadImportedSkills(): ImportedSkill[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as ImportedSkill[]
  } catch {
    return []
  }
}

export function saveImportedSkill(skill: ImportedSkill): void {
  const skills = loadImportedSkills().filter((s) => s.id !== skill.id)
  localStorage.setItem(LS_KEY, JSON.stringify([...skills, skill]))
  window.dispatchEvent(new CustomEvent('sf:skills:change'))
}

export function deleteImportedSkill(id: string): void {
  const skills = loadImportedSkills().filter((s) => s.id !== id)
  localStorage.setItem(LS_KEY, JSON.stringify(skills))
  window.dispatchEvent(new CustomEvent('sf:skills:change'))
}

export function slugify(filename: string): string {
  return 'custom:' + filename
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
