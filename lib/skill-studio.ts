'use client'

/**
 * Phase S1 — Skills Studio draft skill store.
 * Persists authored skills to localStorage keyed as `sf:studio:skills`.
 * Separate from the imported-skills user library — these are authored, versioned skills.
 *
 * ponytail: localStorage covers S1 internal authoring.
 * Upgrade path: persist to DB for S2 team sharing.
 */

import { nanoid } from 'nanoid'
import type {
  SkillManifest,
  SkillPermission,
  SkillNodeRecipe,
  SkillRequires,
  SkillModelPreferences,
  SkillPackagingDefaults,
} from './flow-types'

const LS_KEY = 'sf:studio:skills'

export type SkillFamily = 'script' | 'style' | 'structure' | 'packaging' | 'domain'
export type SkillStatus = 'draft' | 'published' | 'archived'

export type StudioSkill = {
  id: string                          // local draft ID (nanoid)
  status: SkillStatus
  family: SkillFamily
  manifest: Omit<SkillManifest, 'source'> & { source: 'local' }
  /** Director instructions — the system prompt the skill injects */
  instructions: string
  /** Draft changelog entry for the next publish */
  changelogDraft: string
  createdAt: string
  updatedAt: string
  /** Has this ever been test-run successfully? */
  testedAt?: string
}

export function loadStudioSkills(): StudioSkill[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as StudioSkill[]
  } catch {
    return []
  }
}

export function saveStudioSkill(skill: StudioSkill): void {
  const existing = loadStudioSkills().filter((s) => s.id !== skill.id)
  localStorage.setItem(LS_KEY, JSON.stringify([...existing, { ...skill, updatedAt: new Date().toISOString() }]))
  window.dispatchEvent(new CustomEvent('sf:studio:change'))
}

export function deleteStudioSkill(id: string): void {
  localStorage.setItem(LS_KEY, JSON.stringify(loadStudioSkills().filter((s) => s.id !== id)))
  window.dispatchEvent(new CustomEvent('sf:studio:change'))
}

export function getStudioSkill(id: string): StudioSkill | null {
  return loadStudioSkills().find((s) => s.id === id) ?? null
}

/** Create a blank draft skill */
export function createStudioSkill(family: SkillFamily = 'script'): StudioSkill {
  const id = nanoid(10)
  const now = new Date().toISOString()
  return {
    id,
    status: 'draft',
    family,
    manifest: {
      skillId: `local.${id}`,
      version: '0.1.0',
      publisherId: 'local',
      name: 'Untitled Skill',
      tagline: '',
      stages: '',
      source: 'local',
      changelog: '',
      permissions: ['read:brief', 'write:skill_nodes'] as SkillPermission[],
      requires: { briefConfirmed: true } as SkillRequires,
      nodes: [] as SkillNodeRecipe[],
    },
    instructions: '',
    changelogDraft: '',
    createdAt: now,
    updatedAt: now,
  }
}

/** Bump version — patch, minor, or major */
export function bumpVersion(version: string, bump: 'patch' | 'minor' | 'major'): string {
  const [maj, min, pat] = version.split('.').map(Number)
  if (bump === 'major') return `${maj + 1}.0.0`
  if (bump === 'minor') return `${maj}.${min + 1}.0`
  return `${maj}.${min}.${pat + 1}`
}

export const FAMILY_LABELS: Record<SkillFamily, string> = {
  script:    'Script',
  style:     'Style / Look',
  structure: 'Structure',
  packaging: 'Packaging',
  domain:    'Domain',
}

export const FAMILY_DESCRIPTIONS: Record<SkillFamily, string> = {
  script:    'Generates script stages: scenes, dialogue, macro-states',
  style:     'Produces Style Pack drafts and visual constraints',
  structure: 'Beat/act templates and format defaults',
  packaging: 'HyperFrames template preferences and caption rules',
  domain:    'Vertical workflows: training, theater, product demo',
}

export const ALL_PERMISSIONS: { id: SkillPermission; label: string; desc: string }[] = [
  { id: 'read:brief',             label: 'Read Brief',             desc: 'Access confirmed brief fields' },
  { id: 'read:bible',             label: 'Read Character Bible',   desc: 'Access character entries' },
  { id: 'read:style',             label: 'Read Style Lock',        desc: 'Access style rules and packs' },
  { id: 'read:assets',            label: 'Read Assets',            desc: 'Access project asset library' },
  { id: 'write:skill_nodes',      label: 'Write Skill Nodes',      desc: 'Create / update skill-origin nodes' },
  { id: 'write:continuity_patch', label: 'Write Continuity',       desc: 'Submit continuity patches via API' },
  { id: 'suggest:model_route',    label: 'Suggest Model Route',    desc: 'Hint Runway model preferences' },
  { id: 'suggest:packaging',      label: 'Suggest Packaging',      desc: 'Hint HyperFrames template defaults' },
]
