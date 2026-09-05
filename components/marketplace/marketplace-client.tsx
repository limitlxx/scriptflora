'use client'

import { useEffect, useState } from 'react'
import {
  AlertCircle, Check, Download, Loader2, Search,
  Shield, ShieldAlert, ShieldCheck, Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  fetchMarketplaceFeed, filterSkills,
  type MarketplaceSkill,
} from '@/lib/marketplace'
import {
  loadLibrary, installSkill, validatePermissionsForTier,
  TRUST_TIER_LABELS, TRUST_TIER_DESCRIPTIONS,
  type TrustTier,
} from '@/lib/skill-library'
import { FAMILY_LABELS } from '@/lib/skill-studio'
import { ALL_PERMISSIONS } from '@/lib/skill-studio'
import type { SkillFamily } from '@/lib/skill-library'

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

type SortKey = 'popular' | 'newest' | 'rating'

export function MarketplaceClient() {
  const [skills, setSkills] = useState<MarketplaceSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<SkillFamily | 'all'>('all')
  const [tier, setTier] = useState<TrustTier | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('popular')
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set())
  const [installing, setInstalling] = useState<string | null>(null)
  const [installError, setInstallError] = useState('')
  const [detail, setDetail] = useState<MarketplaceSkill | null>(null)

  useEffect(() => {
    void (async () => {
      const feed = await fetchMarketplaceFeed()
      if (!feed) { setError('Could not load marketplace.'); setLoading(false); return }
      setSkills(feed.skills)
      const lib = loadLibrary()
      setInstalledIds(new Set(lib.map((s) => s.manifest.skillId)))
      setLoading(false)
    })()
  }, [])

  const filtered = filterSkills(skills, { query, family, tier, sort })

  const handleInstall = async (skill: MarketplaceSkill) => {
    setInstalling(skill.listingId)
    setInstallError('')

    // Validate permissions for community tier
    const { valid, blocked } = validatePermissionsForTier(skill.manifest.permissions, skill.trustTier)
    if (!valid) {
      setInstallError(`"${skill.manifest.name}" requests restricted permissions for Community tier: ${blocked.join(', ')}`)
      setInstalling(null)
      return
    }

    try {
      installSkill(skill.manifest, {
        instructions: skill.instructions,
        trustTier: skill.trustTier,
        source: 'marketplace',
        actor: 'local',
      })
      setInstalledIds((prev) => new Set([...prev, skill.manifest.skillId]))
    } catch (err) {
      setInstallError(err instanceof Error ? err.message : 'Install failed.')
    } finally {
      setInstalling(null)
    }
  }

  if (loading) return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )

  if (error) return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
      <AlertCircle className="size-4" /> {error}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground/60" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills…"
            className="min-w-0 flex-1 bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground/50" />
        </div>

        {/* Family filter */}
        <select value={family} onChange={(e) => setFamily(e.target.value as SkillFamily | 'all')}
          className="rounded-xl border border-white/[0.08] bg-black/25 px-2.5 py-2 text-[12px] text-foreground/85 outline-none">
          <option value="all">All families</option>
          {(['script', 'style', 'structure', 'packaging', 'domain'] as SkillFamily[]).map((f) => (
            <option key={f} value={f}>{FAMILY_LABELS[f]}</option>
          ))}
        </select>

        {/* Tier filter */}
        <select value={tier} onChange={(e) => setTier(e.target.value as TrustTier | 'all')}
          className="rounded-xl border border-white/[0.08] bg-black/25 px-2.5 py-2 text-[12px] text-foreground/85 outline-none">
          <option value="all">All tiers</option>
          <option value="official">Official</option>
          <option value="verified">Verified</option>
          <option value="community">Community</option>
        </select>

        {/* Sort */}
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-white/[0.08] bg-black/25 px-2.5 py-2 text-[12px] text-foreground/85 outline-none">
          <option value="popular">Most popular</option>
          <option value="newest">Newest</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {installError && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          <p className="text-[11.5px] text-destructive/90">{installError}</p>
        </div>
      )}

      {/* Results */}
      <p className="text-[11px] text-muted-foreground/60">{filtered.length} skill{filtered.length !== 1 ? 's' : ''}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((skill) => {
          const TierIcon = TIER_ICON[skill.trustTier]
          const installed = installedIds.has(skill.manifest.skillId)
          const isInstalling = installing === skill.listingId

          return (
            <div key={skill.listingId}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12]">
              {/* Header */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <TierIcon className={cn('size-3.5 shrink-0', TIER_COLOR[skill.trustTier])} />
                    <span className="text-[13px] font-medium text-foreground/90 truncate">{skill.manifest.name}</span>
                    {skill.publisherVerified && (
                      <Check className="size-3 shrink-0 text-success" title="Verified publisher" />
                    )}
                  </div>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground/60">
                    by {skill.publisherName} · v{skill.manifest.version}
                  </p>
                </div>
                <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-medium',
                  skill.trustTier === 'official'  ? 'bg-primary/10 text-primary/80' :
                  skill.trustTier === 'verified'  ? 'bg-success/10 text-success/80' :
                                                     'bg-warning/10 text-warning/80')}>
                  {TRUST_TIER_LABELS[skill.trustTier]}
                </span>
              </div>

              {/* Tagline */}
              <p className="mb-3 text-[12px] leading-relaxed text-muted-foreground/80">{skill.manifest.tagline}</p>

              {/* Tags */}
              {skill.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {skill.tags.map((t) => (
                    <span key={t} className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9.5px] text-muted-foreground/60">{t}</span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="mb-3 flex items-center gap-3 text-[10.5px] text-muted-foreground/50">
                <span className="flex items-center gap-1"><Download className="size-3" />{skill.downloads.toLocaleString()}</span>
                {skill.rating != null && (
                  <span className="flex items-center gap-1"><Star className="size-3" />{skill.rating.toFixed(1)}</span>
                )}
                <span>{FAMILY_LABELS[skill.family]}</span>
                <span>{skill.price === 'free' ? 'Free' : `$${(skill.price / 100).toFixed(2)}`}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button type="button" onClick={() => setDetail(detail?.listingId === skill.listingId ? null : skill)}
                  className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground">
                  {detail?.listingId === skill.listingId ? 'Hide details' : 'Details'}
                </button>
                <button type="button" onClick={() => void handleInstall(skill)}
                  disabled={installed || isInstalling}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11.5px] font-medium transition-all',
                    'disabled:pointer-events-none',
                    installed
                      ? 'border border-success/25 bg-success/10 text-success opacity-60'
                      : isInstalling
                      ? 'bg-primary/15 text-primary'
                      : 'bg-primary text-primary-foreground hover:opacity-90',
                  )}>
                  {installed ? <><Check className="size-3.5" />Installed</>
                  : isInstalling ? <><Loader2 className="size-3.5 animate-spin" />Installing…</>
                  : <><Download className="size-3.5" />Install</>}
                </button>
              </div>

              {/* Detail panel */}
              {detail?.listingId === skill.listingId && (
                <div className="mt-3 space-y-3 rounded-xl border border-white/[0.07] bg-black/20 p-3">
                  {/* Trust tier explanation */}
                  <div className="flex items-start gap-2 text-[11px]">
                    <TierIcon className={cn('mt-0.5 size-3.5 shrink-0', TIER_COLOR[skill.trustTier])} />
                    <p className="text-muted-foreground/70">{TRUST_TIER_DESCRIPTIONS[skill.trustTier]}</p>
                  </div>

                  {/* Permissions */}
                  <div>
                    <p className="mb-1.5 text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60">
                      Requested permissions
                    </p>
                    <div className="space-y-1">
                      {ALL_PERMISSIONS.map((p) => {
                        const requested = skill.manifest.permissions.includes(p.id)
                        if (!requested) return null
                        return (
                          <div key={p.id} className="flex items-center gap-2 text-[10.5px] text-foreground/80">
                            <span className="size-1.5 rounded-full bg-primary shrink-0" />
                            <span className="font-mono">{p.id}</span>
                            <span className="text-muted-foreground/50">{p.desc}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Node recipe preview */}
                  {skill.manifest.nodes.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60">
                        Stages ({skill.manifest.nodes.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {skill.manifest.nodes.map((n) => (
                          <span key={n.key} className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[9.5px] text-foreground/70">
                            {n.title ?? n.key}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Changelog */}
                  {skill.manifest.changelog && (
                    <p className="text-[10.5px] text-muted-foreground/60">
                      <span className="text-foreground/50">Changelog:</span> {skill.manifest.changelog}
                    </p>
                  )}

                  {/* Community warning */}
                  {skill.trustTier === 'community' && (
                    <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/8 px-2.5 py-2">
                      <ShieldAlert className="mt-0.5 size-3 shrink-0 text-warning" />
                      <p className="text-[10.5px] text-warning/90">
                        Community skill — unreviewed. Review permissions before installing.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground/60">
          <Search className="mx-auto mb-3 size-8 opacity-30" />
          <p className="text-[13px]">No skills match your search.</p>
        </div>
      )}
    </div>
  )
}
