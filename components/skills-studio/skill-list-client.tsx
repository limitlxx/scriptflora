'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Archive, Clock, Plus, Sparkles, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  loadStudioSkills, createStudioSkill, saveStudioSkill, deleteStudioSkill,
  FAMILY_LABELS, type StudioSkill, type SkillFamily, type SkillStatus,
} from '@/lib/skill-studio'

const STATUS_STYLE: Record<SkillStatus, { label: string; cls: string }> = {
  draft:     { label: 'Draft',     cls: 'text-muted-foreground bg-white/[0.06]' },
  published: { label: 'Published', cls: 'text-success bg-success/10' },
  archived:  { label: 'Archived',  cls: 'text-muted-foreground/50 bg-white/[0.04]' },
}

const FILTERS: { id: SkillStatus | 'all'; label: string }[] = [
  { id: 'all',       label: 'All' },
  { id: 'draft',     label: 'Drafts' },
  { id: 'published', label: 'Published' },
  { id: 'archived',  label: 'Archived' },
]

export function SkillListClient() {
  const [skills, setSkills] = useState<StudioSkill[]>([])
  const [filter, setFilter] = useState<SkillStatus | 'all'>('all')
  const [newFamily, setNewFamily] = useState<SkillFamily>('script')

  const reload = () => setSkills(loadStudioSkills())

  useEffect(() => {
    reload()
    const sync = () => reload()
    window.addEventListener('sf:studio:change', sync)
    return () => window.removeEventListener('sf:studio:change', sync)
  }, [])

  const handleCreate = () => {
    const skill = createStudioSkill(newFamily)
    saveStudioSkill(skill)
    // Navigate to editor
    window.location.href = `/skills/${skill.id}`
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this skill draft? This cannot be undone.')) return
    deleteStudioSkill(id)
  }

  const handleArchive = (skill: StudioSkill, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    saveStudioSkill({ ...skill, status: skill.status === 'archived' ? 'draft' : 'archived' })
  }

  const filtered = filter === 'all' ? skills : skills.filter((s) => s.status === filter)

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter tabs */}
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-[11.5px] transition-all',
                filter === f.id
                  ? 'border-primary/45 bg-accent-muted text-primary'
                  : 'border-white/[0.08] text-muted-foreground hover:text-foreground',
              )}>
              {f.label}
              {f.id !== 'all' && (
                <span className="ml-1.5 text-[10px] text-muted-foreground/60">
                  {skills.filter((s) => s.status === f.id).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Family picker */}
          <select value={newFamily} onChange={(e) => setNewFamily(e.target.value as SkillFamily)}
            className="rounded-lg border border-white/[0.08] bg-black/25 px-2.5 py-1.5 text-[11.5px] text-foreground/85 outline-none">
            {(['script', 'style', 'structure', 'packaging', 'domain'] as SkillFamily[]).map((f) => (
              <option key={f} value={f}>{FAMILY_LABELS[f]}</option>
            ))}
          </select>
          <button type="button" onClick={handleCreate}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            <Plus className="size-3.5" />
            New skill
          </button>
        </div>
      </div>

      {/* Skill list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] py-16 text-center">
          <Sparkles className="mx-auto mb-3 size-8 text-muted-foreground/30" />
          <p className="text-[13px] font-medium text-foreground/60">No skills yet</p>
          <p className="mt-1 text-[12px] text-muted-foreground/50">
            Create your first skill to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((skill) => {
            const s = STATUS_STYLE[skill.status]
            return (
              <Link key={skill.id} href={`/skills/${skill.id}`}
                className={cn(
                  'flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition-all',
                  'hover:border-white/[0.12] hover:bg-white/[0.04]',
                  skill.status === 'archived' && 'opacity-50',
                )}>
                {/* Status dot */}
                <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', s.cls)}>
                  {s.label}
                </span>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground/90 truncate">
                    {skill.manifest.name || 'Untitled Skill'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70 truncate">
                    {FAMILY_LABELS[skill.family]} · v{skill.manifest.version}
                    {skill.manifest.tagline && ` · ${skill.manifest.tagline}`}
                  </p>
                </div>

                {/* Permissions count */}
                <span className="shrink-0 text-[10.5px] text-muted-foreground/50">
                  {skill.manifest.permissions.length} permission{skill.manifest.permissions.length !== 1 ? 's' : ''}
                </span>

                {/* Tested indicator */}
                {skill.testedAt && (
                  <span className="flex shrink-0 items-center gap-1 text-[10px] text-success/70">
                    <Clock className="size-3" />
                    Tested
                  </span>
                )}

                {/* Actions */}
                <div className="flex shrink-0 gap-1" onClick={(e) => e.preventDefault()}>
                  <button type="button" onClick={(e) => handleArchive(skill, e)}
                    title={skill.status === 'archived' ? 'Restore' : 'Archive'}
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:bg-white/[0.06] hover:text-foreground transition-colors">
                    <Archive className="size-3.5" />
                  </button>
                  {skill.status === 'draft' && (
                    <button type="button" onClick={(e) => handleDelete(skill.id, e)}
                      title="Delete"
                      className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
