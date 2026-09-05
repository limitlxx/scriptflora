'use client'

/**
 * Phase S2 — Team Skill Library.
 *
 * Manages installed skills (distinct from authored studio drafts).
 * Skills can be installed from:
 *   - Built-in (first-party, always available)
 *   - JSON file import (team sharing — export from Studio, import here)
 *   - Marketplace (Phase S3)
 *
 * ponytail: localStorage covers S2 team sharing via JSON export/import.
 * Upgrade path: replace localStorage with a team DB when S3 cloud sharing is built.
 */

import { nanoid } from 'nanoid'
import type { SkillManifest, SkillPermission } from './flow-types'
import { SKILL_MANIFESTS } from './flow-types'

const LS_LIBRARY_KEY  = 'sf:skill-library'
const LS_AUDIT_KEY    = 'sf:skill-audit'

// ── Trust tiers ──────────────────────────────────────────────────

export type TrustTier = 'official' | 'verified' | 'community'

export const TRUST_TIER_LABELS: Record<TrustTier, string> = {
  official:  'Official',
  verified:  'Verified',
  community: 'Community',
}

export const TRUST_TIER_DESCRIPTIONS: Record<TrustTier, string> = {
  official:  'ScriptFlora first-party — always safe',
  verified:  'Reviewed publisher — identity confirmed',
  community: 'Unreviewed — inspect permissions before use',
}

// ── Installed skill entry ────────────────────────────────────────

export type InstalledSkill = {
  installId: string               // unique install record ID
  manifest: SkillManifest
  /** Full instructions / prompt (may be absent for stub installs) */
  instructions?: string
  trustTier: TrustTier
  installedAt: string             // ISO timestamp
  installedBy: string             // email or "local"
  /** Version that was pinned at install time */
  pinnedVersion: string
  /** If a newer version exists in the source, this is set */
  availableVersion?: string
  source: 'builtin' | 'import' | 'marketplace'
  enabled: boolean
}

// ── Audit log entry ──────────────────────────────────────────────

export type AuditAction = 'install' | 'uninstall' | 'update' | 'enable' | 'disable' | 'permission_review'

export type AuditLogEntry = {
  id: string
  action: AuditAction
  skillId: string
  skillVersion: string
  actor: string                   // email or "local"
  timestamp: string
  details?: string
}

// ── Store helpers ────────────────────────────────────────────────

export function loadLibrary(): InstalledSkill[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(LS_LIBRARY_KEY) ?? '[]') as InstalledSkill[]
    // Always ensure built-in skills are present
    return ensureBuiltins(raw)
  } catch {
    return ensureBuiltins([])
  }
}

/** Ensure first-party skills are always in the library */
function ensureBuiltins(current: InstalledSkill[]): InstalledSkill[] {
  const existingIds = new Set(current.map((s) => s.manifest.skillId))
  const builtins: InstalledSkill[] = Object.values(SKILL_MANIFESTS)
    .filter((m) => !existingIds.has(m.skillId))
    .map((m) => ({
      installId: `builtin-${m.skillId}`,
      manifest: m,
      trustTier: 'official' as TrustTier,
      installedAt: new Date().toISOString(),
      installedBy: 'system',
      pinnedVersion: m.version,
      source: 'builtin' as const,
      enabled: true,
    }))
  return [...current, ...builtins]
}

function saveLibrary(library: InstalledSkill[]): void {
  // Don't persist builtin stubs — they're always re-added from SKILL_MANIFESTS
  const toSave = library.filter((s) => s.source !== 'builtin')
  localStorage.setItem(LS_LIBRARY_KEY, JSON.stringify(toSave))
  window.dispatchEvent(new CustomEvent('sf:library:change'))
}

export function installSkill(
  manifest: SkillManifest,
  options: { trustTier?: TrustTier; instructions?: string; actor?: string; source?: InstalledSkill['source'] } = {}
): InstalledSkill {
  const library = loadLibrary()
  const existing = library.find((s) => s.manifest.skillId === manifest.skillId)

  const entry: InstalledSkill = {
    installId: existing?.installId ?? nanoid(10),
    manifest,
    instructions: options.instructions,
    trustTier: options.trustTier ?? 'community',
    installedAt: existing?.installedAt ?? new Date().toISOString(),
    installedBy: options.actor ?? 'local',
    pinnedVersion: manifest.version,
    source: options.source ?? 'import',
    enabled: true,
  }

  const updated = [...library.filter((s) => s.manifest.skillId !== manifest.skillId), entry]
  saveLibrary(updated)
  appendAudit({ action: 'install', skillId: manifest.skillId, skillVersion: manifest.version, actor: options.actor ?? 'local' })
  return entry
}

export function uninstallSkill(skillId: string, actor = 'local'): void {
  const library = loadLibrary().filter((s) => s.manifest.skillId !== skillId || s.source === 'builtin')
  saveLibrary(library)
  appendAudit({ action: 'uninstall', skillId, skillVersion: '', actor })
}

export function toggleSkillEnabled(skillId: string, enabled: boolean, actor = 'local'): void {
  const library = loadLibrary().map((s) =>
    s.manifest.skillId === skillId ? { ...s, enabled } : s
  )
  saveLibrary(library)
  appendAudit({ action: enabled ? 'enable' : 'disable', skillId, skillVersion: '', actor })
}

export function markUpdateAvailable(skillId: string, availableVersion: string): void {
  const library = loadLibrary().map((s) =>
    s.manifest.skillId === skillId ? { ...s, availableVersion } : s
  )
  saveLibrary(library)
}

// ── Audit log ────────────────────────────────────────────────────

function appendAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return
  const log = loadAuditLog()
  const newEntry: AuditLogEntry = { ...entry, id: nanoid(8), timestamp: new Date().toISOString() }
  localStorage.setItem(LS_AUDIT_KEY, JSON.stringify([newEntry, ...log].slice(0, 200))) // cap at 200
  window.dispatchEvent(new CustomEvent('sf:audit:change'))
}

export function loadAuditLog(): AuditLogEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LS_AUDIT_KEY) ?? '[]') as AuditLogEntry[]
  } catch {
    return []
  }
}

// ── Export/import helpers ────────────────────────────────────────

export type SkillPackage = {
  schemaVersion: '1.0'
  exportedAt: string
  manifest: SkillManifest
  instructions: string
}

export function exportSkillAsJSON(installed: InstalledSkill): string {
  const pkg: SkillPackage = {
    schemaVersion: '1.0',
    exportedAt: new Date().toISOString(),
    manifest: installed.manifest,
    instructions: installed.instructions ?? '',
  }
  return JSON.stringify(pkg, null, 2)
}

export function parseSkillPackage(json: string): SkillPackage | null {
  try {
    const pkg = JSON.parse(json) as SkillPackage
    if (pkg.schemaVersion !== '1.0' || !pkg.manifest?.skillId) return null
    return pkg
  } catch {
    return null
  }
}

// ── Permission validation ────────────────────────────────────────

/** Community skills cannot request write:continuity_patch or suggest:model_route */
const COMMUNITY_BLOCKED_PERMISSIONS: SkillPermission[] = ['write:continuity_patch', 'suggest:model_route']

export function validatePermissionsForTier(
  permissions: SkillPermission[],
  tier: TrustTier
): { valid: boolean; blocked: SkillPermission[] } {
  if (tier !== 'community') return { valid: true, blocked: [] }
  const blocked = permissions.filter((p) => COMMUNITY_BLOCKED_PERMISSIONS.includes(p))
  return { valid: blocked.length === 0, blocked }
}
