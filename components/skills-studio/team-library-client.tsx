'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  AlertCircle, ArrowDownToLine, Check, Clock, Download,
  Shield, ShieldAlert, ShieldCheck, ToggleLeft, Trash2, Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  loadLibrary, installSkill, uninstallSkill, toggleSkillEnabled,
  exportSkillAsJSON, parseSkillPackage, loadAuditLog,
  validatePermissionsForTier,
  TRUST_TIER_LABELS, TRUST_TIER_DESCRIPTIONS,
  type InstalledSkill, type TrustTier, type AuditLogEntry,
} from '@/lib/skill-library'
import { ALL_PERMISSIONS } from '@/lib/skill-studio'

const TIER_ICON: Record<TrustTier, React.ComponentType<{ className?: string }>> = {
  official:  ShieldCheck,
  verified:  Shield,
  community: ShieldAlert,
}

const TIER_COLOR: Record<TrustTier, string> = {
  official:  'text-primary',
  verified:  'text-success',
  community: 'text-warning',
}

const TABS = ['Installed', 'Audit log'] as const
type Tab = (typeof TABS)[number]

export function TeamLibraryClient() {
  const [library, setLibrary] = useState<InstalledSkill[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [tab, setTab] = useState<Tab>('Installed')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')
  const [reviewSkill, setReviewSkill] = useState<InstalledSkill | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const reload = () => {
    setLibrary(loadLibrary())
    setAuditLog(loadAuditLog())
  }

  useEffect(() => {
    reload()
    const sync = () => reload()
    window.addEventListener('sf:library:change', sync)
    window.addEventListener('sf:audit:change', sync)
    return () => {
      window.removeEventListener('sf:library:change', sync)
      window.removeEventListener('sf:audit:change', sync)
    }
  }, [])

  // ── Import ────────────────────────────────────────────────────────
  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportError('')
    setImportSuccess('')

    try {
      const json = await file.text()
      const pkg = parseSkillPackage(json)
      if (!pkg) {
        setImportError('Invalid skill package. Make sure it was exported from ScriptFlora Studio.')
        return
      }

      // Validate permissions for community tier
      const tier: TrustTier = 'community'
      const { valid, blocked } = validatePermissionsForTier(pkg.manifest.permissions, tier)
      if (!valid) {
        setImportError(`Skill requests restricted permissions for Community tier: ${blocked.join(', ')}. Contact the author to remove them.`)
        return
      }

      installSkill(pkg.manifest, {
        instructions: pkg.instructions,
        trustTier: tier,
        source: 'import',
        actor: 'local',
      })
      setImportSuccess(`"${pkg.manifest.name}" installed successfully as Community skill.`)
      reload()
    } catch {
      setImportError('Failed to read file.')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ── Export ────────────────────────────────────────────────────────
  const handleExport = (skill: InstalledSkill) => {
    const json = exportSkillAsJSON(skill)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${skill.manifest.skillId.replace(/\./g, '-')}-v${skill.manifest.version}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-0.5 rounded-xl border border-white/[0.07] bg-black/20 p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-[12px] font-medium transition-all',
              tab === t ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground',
            )}>
            {t}
            {t === 'Audit log' && auditLog.length > 0 && (
              <span className="ml-1.5 text-[10px] text-muted-foreground/60">{auditLog.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Installed tab ── */}
      {tab === 'Installed' && (
        <div className="space-y-4">
          {/* Import */}
          <div className="flex flex-wrap items-center gap-3">
            <label className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-[12px] text-muted-foreground',
              'transition-colors hover:border-primary/35 hover:text-foreground',
              importing && 'pointer-events-none opacity-50',
            )}>
              <Upload className="size-3.5" />
              {importing ? 'Importing…' : 'Import skill (.json)'}
              <input ref={fileRef} type="file" accept=".json" className="hidden"
                onChange={handleImport} />
            </label>
            {importError && (
              <span className="flex items-center gap-1.5 text-[11px] text-destructive">
                <AlertCircle className="size-3" /> {importError}
              </span>
            )}
            {importSuccess && (
              <span className="flex items-center gap-1.5 text-[11px] text-success">
                <Check className="size-3" /> {importSuccess}
              </span>
            )}
          </div>

          {/* Skill list */}
          <div className="space-y-2">
            {library.map((skill) => {
              const TierIcon = TIER_ICON[skill.trustTier]
              const hasUpdate = Boolean(skill.availableVersion && skill.availableVersion !== skill.pinnedVersion)
              return (
                <div key={skill.installId}
                  className={cn(
                    'rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4',
                    !skill.enabled && 'opacity-50',
                  )}>
                  <div className="flex items-start gap-3">
                    {/* Trust tier icon */}
                    <TierIcon className={cn('mt-0.5 size-4 shrink-0', TIER_COLOR[skill.trustTier])} />

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-medium text-foreground/90">
                          {skill.manifest.name}
                        </span>
                        <span className="rounded-full border border-white/[0.06] px-2 py-0.5 text-[9.5px] text-muted-foreground/60">
                          {TRUST_TIER_LABELS[skill.trustTier]}
                        </span>
                        {skill.source === 'builtin' && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9.5px] font-medium text-primary/80">
                            Built-in
                          </span>
                        )}
                        {hasUpdate && (
                          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[9.5px] font-medium text-warning/80">
                            Update available v{skill.availableVersion}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                        {skill.manifest.tagline || skill.manifest.skillId}
                      </p>
                      <p className="mt-1 text-[10.5px] text-muted-foreground/50">
                        v{skill.pinnedVersion} · {skill.manifest.permissions.length} permissions · installed {new Date(skill.installedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      {/* Review permissions */}
                      <button type="button" onClick={() => setReviewSkill(reviewSkill?.installId === skill.installId ? null : skill)}
                        title="Review permissions"
                        className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:bg-white/[0.06] hover:text-foreground">
                        <Shield className="size-3.5" />
                      </button>
                      {/* Export */}
                      <button type="button" onClick={() => handleExport(skill)}
                        title="Export as JSON for sharing"
                        className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:bg-white/[0.06] hover:text-foreground">
                        <Download className="size-3.5" />
                      </button>
                      {/* Toggle enabled */}
                      {skill.source !== 'builtin' && (
                        <button type="button" onClick={() => { toggleSkillEnabled(skill.manifest.skillId, !skill.enabled); reload() }}
                          title={skill.enabled ? 'Disable skill' : 'Enable skill'}
                          className={cn('flex size-7 items-center justify-center rounded-lg transition-colors',
                            skill.enabled ? 'text-muted-foreground/40 hover:text-warning' : 'text-warning/40 hover:text-warning')}>
                          <ToggleLeft className="size-3.5" />
                        </button>
                      )}
                      {/* Uninstall */}
                      {skill.source !== 'builtin' && (
                        <button type="button"
                          onClick={() => { if (confirm(`Uninstall "${skill.manifest.name}"?`)) { uninstallSkill(skill.manifest.skillId); reload() } }}
                          title="Uninstall"
                          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Permission review panel */}
                  {reviewSkill?.installId === skill.installId && (
                    <div className="mt-3 rounded-xl border border-white/[0.07] bg-black/20 p-3">
                      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">
                        Declared permissions
                      </p>
                      <div className="space-y-1">
                        {ALL_PERMISSIONS.map((p) => {
                          const granted = skill.manifest.permissions.includes(p.id)
                          return (
                            <div key={p.id} className={cn('flex items-center gap-2 text-[11px]', granted ? 'text-foreground/80' : 'text-muted-foreground/30')}>
                              <span className={cn('size-1.5 rounded-full shrink-0', granted ? 'bg-primary' : 'bg-white/10')} />
                              <span className="font-mono">{p.id}</span>
                              <span className="text-muted-foreground/50">{p.desc}</span>
                            </div>
                          )
                        })}
                      </div>
                      {skill.trustTier === 'community' && (
                        <p className="mt-2 text-[10.5px] text-warning/80">
                          Community skill — review permissions carefully before use.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Audit log tab ── */}
      {tab === 'Audit log' && (
        <div className="space-y-1.5">
          {auditLog.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-muted-foreground/60">No activity yet.</p>
          ) : (
            auditLog.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-3.5 py-2.5">
                <Clock className="size-3 shrink-0 text-muted-foreground/40" />
                <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-medium',
                  entry.action === 'install'   ? 'bg-success/10 text-success' :
                  entry.action === 'uninstall' ? 'bg-destructive/10 text-destructive' :
                  entry.action === 'disable'   ? 'bg-warning/10 text-warning' :
                                                  'bg-white/[0.06] text-muted-foreground',
                )}>
                  {entry.action}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground/70">{entry.skillId}</span>
                {entry.skillVersion && (
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50">v{entry.skillVersion}</span>
                )}
                <span className="shrink-0 text-[10px] text-muted-foreground/40">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
