'use client'

import { type NodeProps } from '@xyflow/react'
import {
  Check, ChevronDown, ChevronUp, Film, Lock, LockOpen, Plus, Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { nanoid } from 'nanoid'
import { cn } from '@/lib/utils'
import type { SeriesArcNode as SeriesArcNodeType, ArcBeat } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'

const BEAT_STATUS_OPTIONS: { id: ArcBeat['status']; label: string; cls: string }[] = [
  { id: 'planned',   label: 'Planned',   cls: 'text-muted-foreground bg-white/[0.06]' },
  { id: 'written',   label: 'Written',   cls: 'text-primary bg-primary/10' },
  { id: 'generated', label: 'Generated', cls: 'text-primary bg-primary/15' },
  { id: 'complete',  label: 'Complete',  cls: 'text-success bg-success/10' },
]

function ArcBeatCard({
  beat,
  disabled,
  onChange,
  onRemove,
}: {
  beat: ArcBeat
  disabled: boolean
  onChange: (patch: Partial<ArcBeat>) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const s = BEAT_STATUS_OPTIONS.find((o) => o.id === beat.status) ?? BEAT_STATUS_OPTIONS[0]

  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium', s.cls)}>
          {s.label}
        </span>
        <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-foreground/90">
          {beat.label || 'Unnamed beat'}
        </span>
        <span className="shrink-0 font-mono text-[9.5px] text-muted-foreground/60">{beat.episodeRange}</span>
        <button type="button" onClick={() => setOpen((v) => !v)}
          className="shrink-0 text-muted-foreground hover:text-foreground">
          {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        {!disabled && (
          <button type="button" onClick={onRemove} aria-label="Remove beat"
            className="shrink-0 text-muted-foreground/30 hover:text-destructive">
            <Trash2 className="size-3" />
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-2.5 border-t border-white/[0.06] px-3 pb-3 pt-2.5">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <FieldLabel>Beat label</FieldLabel>
              <input value={beat.label} disabled={disabled}
                onChange={(e) => onChange({ label: e.target.value })}
                placeholder="Act 1 — Setup" className={fieldClass} />
            </label>
            <label className="block">
              <FieldLabel>Episode range</FieldLabel>
              <input value={beat.episodeRange} disabled={disabled}
                onChange={(e) => onChange({ episodeRange: e.target.value })}
                placeholder="Ep 1–3" className={fieldClass} />
            </label>
          </div>

          {/* Status picker */}
          <div>
            <FieldLabel>Status</FieldLabel>
            <div className="flex gap-1.5">
              {BEAT_STATUS_OPTIONS.map((opt) => (
                <button key={opt.id} type="button" disabled={disabled}
                  aria-pressed={beat.status === opt.id}
                  onClick={() => onChange({ status: opt.id })}
                  className={cn(
                    'nodrag flex-1 rounded-lg border py-1 text-[10px] transition-all',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
                    beat.status === opt.id
                      ? 'border-primary/45 bg-accent-muted text-primary'
                      : 'border-white/[0.08] bg-black/20 text-muted-foreground hover:text-foreground',
                  )}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <FieldLabel>Description</FieldLabel>
            <textarea value={beat.description} disabled={disabled} rows={2}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="What happens in this arc beat…"
              className={cn(fieldClass, 'resize-none')} />
          </label>
          <label className="block">
            <FieldLabel>Character milestones</FieldLabel>
            <textarea value={beat.characterMilestones} disabled={disabled} rows={2}
              onChange={(e) => onChange({ characterMilestones: e.target.value })}
              placeholder="Who changes, how, and why"
              className={cn(fieldClass, 'resize-none text-[11px]')} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <FieldLabel>Open threads</FieldLabel>
              <textarea value={beat.openThreads} disabled={disabled} rows={2}
                onChange={(e) => onChange({ openThreads: e.target.value })}
                placeholder="Unresolved"
                className={cn(fieldClass, 'resize-none text-[11px]')} />
            </label>
            <label className="block">
              <FieldLabel>Resolved threads</FieldLabel>
              <textarea value={beat.resolvedThreads} disabled={disabled} rows={2}
                onChange={(e) => onChange({ resolvedThreads: e.target.value })}
                placeholder="Closed"
                className={cn(fieldClass, 'resize-none text-[11px]')} />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

export function SeriesArcNode({ id, data, selected }: NodeProps<SeriesArcNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const disabled = Boolean(data.locked)

  const beats = data.beats ?? []

  const addBeat = () => {
    const newBeat: ArcBeat = {
      id: nanoid(8),
      label: `Act ${beats.length + 1}`,
      episodeRange: '',
      description: '',
      status: 'planned',
      characterMilestones: '',
      openThreads: '',
      resolvedThreads: '',
    }
    update(id, { beats: [...beats, newBeat], status: 'draft' })
  }

  const updateBeat = (idx: number, patch: Partial<ArcBeat>) => {
    const next = beats.map((b, i) => i === idx ? { ...b, ...patch } : b)
    update(id, { beats: next })
  }

  const removeBeat = (idx: number) =>
    update(id, { beats: beats.filter((_, i) => i !== idx) })

  const completeCount = beats.filter((b) => b.status === 'complete').length

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={440}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton icon={data.locked ? LockOpen : Lock} label={data.locked ? 'Unlock' : 'Lock'}
              active={data.locked} onClick={() => act(id, data.locked ? 'unlock' : 'lock')} />
            <ToolbarDivider />
            <ToolbarButton icon={Trash2} label="Delete node" tone="danger" onClick={() => act(id, 'delete')} />
          </>
        }
      >
        <NodeHeader
          icon={Film}
          title="Series Arc"
          subtitle="Season / film arc tracker"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3.5 px-4 py-3.5">
          {/* Series meta */}
          <div className="grid grid-cols-3 gap-2">
            <label className="col-span-1 block">
              <FieldLabel>Episodes</FieldLabel>
              <input type="number" min={1} value={data.totalEpisodes} disabled={disabled}
                onChange={(e) => update(id, { totalEpisodes: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                className={cn(fieldClass, 'text-center')} />
            </label>
            <label className="col-span-1 block">
              <FieldLabel>Current ep</FieldLabel>
              <input type="number" min={1} value={data.currentEpisode} disabled={disabled}
                onChange={(e) => update(id, { currentEpisode: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                className={cn(fieldClass, 'text-center')} />
            </label>
            <label className="col-span-1 block">
              <FieldLabel>Series title</FieldLabel>
              <input value={data.seriesTitle} disabled={disabled}
                onChange={(e) => update(id, { seriesTitle: e.target.value })}
                placeholder="My Series" className={fieldClass} />
            </label>
          </div>

          {/* Progress bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
              <span className="text-muted-foreground">Arc beats complete</span>
              <span className="font-mono text-foreground/80">{completeCount} / {beats.length}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className={cn('h-full rounded-full transition-all duration-500', beats.length > 0 && completeCount === beats.length ? 'bg-success' : 'bg-primary')}
                style={{ width: beats.length > 0 ? `${Math.round((completeCount / beats.length) * 100)}%` : '0%' }}
              />
            </div>
          </div>

          {/* Overall arcs */}
          <label className="block">
            <FieldLabel>Overarching themes</FieldLabel>
            <textarea value={data.overarchingThemes} disabled={disabled} rows={2}
              onChange={(e) => update(id, { overarchingThemes: e.target.value })}
              placeholder="What the whole series is really about…"
              className={cn(fieldClass, 'resize-none')} />
          </label>
          <label className="block">
            <FieldLabel>Character arcs (series-wide)</FieldLabel>
            <textarea value={data.characterArcs} disabled={disabled} rows={2}
              onChange={(e) => update(id, { characterArcs: e.target.value })}
              placeholder="How each main character changes from start to finish…"
              className={cn(fieldClass, 'resize-none')} />
          </label>

          {/* Arc beats */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <FieldLabel>Arc beats</FieldLabel>
            </div>
            <div className="scroll-slim max-h-[400px] space-y-1.5 overflow-y-auto">
              {beats.length === 0 && (
                <p className="py-2 text-center text-[10.5px] text-muted-foreground">
                  No beats yet — add your first arc beat below.
                </p>
              )}
              {beats.map((beat, i) => (
                <ArcBeatCard key={beat.id} beat={beat} disabled={disabled}
                  onChange={(patch) => updateBeat(i, patch)}
                  onRemove={() => removeBeat(i)} />
              ))}
            </div>
            {!disabled && (
              <button type="button" onClick={addBeat}
                className={cn(
                  'nodrag mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.12] py-2',
                  'text-[11.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground',
                )}>
                <Plus className="size-3.5" /> Add arc beat
              </button>
            )}
          </div>
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{data.seriesTitle || 'Untitled series'}</span>
          <span className="font-mono text-[10px]">
            Ep {data.currentEpisode} / {data.totalEpisodes} · {beats.length} beats
          </span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
