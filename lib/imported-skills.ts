'use client'

/**
 * Persists user-imported skill markdown files to localStorage.
 * Phase 8: now stores version + publisherId so the skill can be treated
 * as a local SkillManifest with pinnable version on each project.
 */

const LS_KEY = 'sf:imported-skills'

export type ImportedSkill = {
  id: string         // slug e.g. "custom:my-skill"
  name: string       // display name
  markdown: string   // full file content
  /** Phase 8 provenance */
  version: string    // always "0.0.0" for local imports until the user sets one
  publisherId: string // "local" for user-imported skills
}

export function loadImportedSkills(): ImportedSkill[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as ImportedSkill[]
    // Back-fill provenance fields for skills saved before Phase 8
    return raw.map((s) => ({
      version: '0.0.0',
      publisherId: 'local',
      ...s,
    }))
  } catch {
    return []
  }
}

export function saveImportedSkill(skill: Omit<ImportedSkill, 'version' | 'publisherId'> & Partial<Pick<ImportedSkill, 'version' | 'publisherId'>>): void {
  const full: ImportedSkill = {
    version: '0.0.0',
    publisherId: 'local',
    ...skill,
  }
  const skills = loadImportedSkills().filter((s) => s.id !== full.id)
  localStorage.setItem(LS_KEY, JSON.stringify([...skills, full]))
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
