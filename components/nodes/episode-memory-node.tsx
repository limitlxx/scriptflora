'use client'

import { type NodeProps } from '@xyflow/react'
import {
  ArrowRight, BookOpen, Check, ChevronDown, ChevronUp,
  Lock, LockOpen, Save, Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { EpisodeMemoryNode as EpisodeMemoryNodeType, CharacterStateSnapshot } from '@/lib/flow-types'
import { saveEpisodeMemory, getEpisodeHandoff, type EpisodeMemoryRecord } from '@/lib/store'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'

function CharacterSnapshotRow({
  snap,
  disabled,
  onChange,
}: {
  snap: CharacterStateSnapshot
  disabled: boolean
  onChange: (patch: Partial<CharacterStateSnapshot>) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-foreground/90">{snap.characterName || 'Unnamed'}</span>
        <button type="button" onClick={() => setOpen((v) => !v)}
          className="shrink-0 text-muted-foreground hover:text-foreground">
          {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      </div>
      {open && (
        <div className="space-y-2 border-t border-white/[0.06] px-3 pb-3 pt-2.5">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <FieldLabel>Exit state</FieldLabel>
              <textarea value={snap.exitState} disabled={disabled} rows={2}
                onChange={(e) => onChange({ exitState: e.target.value })}
                placeholder="How they leave this episode"
                className={cn(fieldClass, 'resize-none text-[11px]')} />
            </label>
            <label className="block">
              <FieldLabel>Entry state (next ep)</FieldLabel>
              <textarea value={snap.entryState} disabled={disabled} rows={2}
                onChange={(e) => onChange({ entryState: e.target.value })}
                placeholder="How they should start next episode"
                className={cn(fieldClass, 'resize-none text-[11px]')} />
            </label>
          </div>
          <label className="block">
            <FieldLabel>Wardrobe at end</FieldLabel>
            <input value={snap.wardrobeAtEnd} disabled={disabled}
              onChange={(e) => onChange({ wardrobeAtEnd: e.target.value })}
              placeholder="What they're wearing when they exit"
              className={fieldClass} />
          </label>
        </div>
      )}
    </div>
  )
}

export function EpisodeMemoryNode({ id, data, selected }: NodeProps<EpisodeMemoryNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [seriesId, setSeriesId] = useState('')
  const [saved, setSaved] = useState(false)
  const [handoffLoaded, setHandoffLoaded] = useState(false)
  const disabled = Boolean(data.locked)

  // Auto-populate character snapshots from locked characters on the canvas
  const syncCharacters = () => {
    type CanvasNode = { type?: string; data: { characters?: Array<{ id: string; name: string; status: string }> } }
    const allNodes = ((window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined) ?? []
    const bible = allNodes.find((n) => n.type === 'character-bible')
    const locked = (bible?.data?.characters ?? []).filter((c) => c.status === 'locked')
    if (locked.length === 0) return

    const existing = new Map((data.characterSnapshots ?? []).map((s) => [s.characterId, s]))
    const snapshots: CharacterStateSnapshot[] = locked.map((c) => existing.get(c.id) ?? {
      characterId: c.id,
      characterName: c.name,
      exitState: '',
      entryState: '',
      wardrobeAtEnd: '',
    })
    update(id, { characterSnapshots: snapshots })
  }

  const updateSnapshot = (idx: number, patch: Partial<CharacterStateSnapshot>) => {
    const snaps = [...(data.characterSnapshots ?? [])]
    snaps[idx] = { ...snaps[idx], ...patch }
    update(id, { characterSnapshots: snaps })
  }

  // Save this episode's memory to the cross-project series store
  const handleSave = () => {
    if (!seriesId.trim()) return
    const record: EpisodeMemoryRecord = {
      episodeNumber: data.episodeNumber,
      episodeTitle: data.episodeTitle,
      projectId: typeof window !== 'undefined' ? (window.location.search.split('project=')[1] ?? 'unknown') : 'unknown',
      characterSnapshots: data.characterSnapshots ?? [],
      revealedFacts: data.revealedFacts,
      openThreads: data.openThreads,
      resolvedThreads: data.resolvedThreads,
      savedAt: new Date().toISOString(),
    }
    saveEpisodeMemory(seriesId.trim(), seriesId.trim(), record)
    update(id, { status: 'approved' })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  // Load previous episode's exit state as this episode's entry context
  const loadHandoff = () => {
    if (!seriesId.trim() || data.episodeNumber <= 1) return
    const prev = getEpisodeHandoff(seriesId.trim(), data.episodeNumber - 1)
    if (!prev) return
    // Merge previous exit states into current entry states
    const merged: CharacterStateSnapshot[] = (data.characterSnapshots ?? []).map((s) => {
      const prevSnap = prev.characterSnapshots.find((p) => p.characterId === s.characterId)
      return prevSnap ? { ...s, entryState: prevSnap.exitState } : s
    })
    update(id, {
      characterSnapshots: merged,
      openThreads: prev.openThreads,
      revealedFacts: prev.revealedFacts,
    })
    setHandoffLoaded(true)
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={420}
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
          icon={BookOpen}
          title="Episode Memory"
          subtitle="Exit state → next episode entry"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3.5 px-4 py-3.5">
          {/* Series ID + episode number */}
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <FieldLabel>Series ID</FieldLabel>
              <input value={seriesId} disabled={disabled}
                onChange={(e) => setSeriesId(e.target.value)}
                placeholder="my-series" className={fieldClass} />
            </label>
            <label className="block">
              <FieldLabel>Episode number</FieldLabel>
              <input type="number" min={1} value={data.episodeNumber} disabled={disabled}
                onChange={(e) => update(id, { episodeNumber: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                className={cn(fieldClass, 'text-center')} />
            </label>
          </div>

          <label className="block">
            <FieldLabel>Episode title</FieldLabel>
            <input value={data.episodeTitle} disabled={disabled}
              onChange={(e) => update(id, { episodeTitle: e.target.value })}
              placeholder="Episode 1 — The Arrival" className={fieldClass} />
          </label>

          {/* Load handoff from previous episode */}
          {data.episodeNumber > 1 && (
            <button type="button" onClick={loadHandoff} disabled={disabled || !seriesId.trim()}
              className={cn(
                'nodrag flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-[11.5px] transition-all',
                handoffLoaded
                  ? 'border-success/25 bg-success/10 text-success'
                  : 'border-primary/25 bg-primary/8 text-primary hover:bg-primary/15',
                (!seriesId.trim() || disabled) && 'opacity-40 pointer-events-none',
              )}>
              {handoffLoaded
                ? <><Check className="size-3.5" />Handoff loaded from episode {data.episodeNumber - 1}</>
                : <><ArrowRight className="size-3.5" />Load exit states from episode {data.episodeNumber - 1}</>
              }
            </button>
          )}

          {/* Character snapshots */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <FieldLabel>Character exit / entry states</FieldLabel>
              <button type="button" onClick={syncCharacters} disabled={disabled}
                className="text-[10px] text-primary hover:underline disabled:opacity-40">
                Sync from Bible
              </button>
            </div>
            {(data.characterSnapshots ?? []).length === 0 ? (
              <p className="text-center text-[10.5px] text-muted-foreground py-2">
                No characters yet. Click "Sync from Bible" to import locked characters.
              </p>
            ) : (
              <div className="space-y-1.5">
                {(data.characterSnapshots ?? []).map((snap, i) => (
                  <CharacterSnapshotRow key={snap.characterId} snap={snap} disabled={disabled}
                    onChange={(patch) => updateSnapshot(i, patch)} />
                ))}
              </div>
            )}
          </div>

          {/* Narrative threads */}
          <label className="block">
            <FieldLabel>Revealed facts this episode</FieldLabel>
            <textarea value={data.revealedFacts} disabled={disabled} rows={2}
              onChange={(e) => update(id, { revealedFacts: e.target.value })}
              placeholder="Facts the audience now knows…"
              className={cn(fieldClass, 'resize-none')} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <FieldLabel>Open threads</FieldLabel>
              <textarea value={data.openThreads} disabled={disabled} rows={2}
                onChange={(e) => update(id, { openThreads: e.target.value })}
                placeholder="Unresolved at episode end"
                className={cn(fieldClass, 'resize-none text-[11px]')} />
            </label>
            <label className="block">
              <FieldLabel>Resolved threads</FieldLabel>
              <textarea value={data.resolvedThreads} disabled={disabled} rows={2}
                onChange={(e) => update(id, { resolvedThreads: e.target.value })}
                placeholder="Closed in this episode"
                className={cn(fieldClass, 'resize-none text-[11px]')} />
            </label>
          </div>

          <label className="block">
            <FieldLabel>Director notes for next episode</FieldLabel>
            <textarea value={data.nextEpisodeNotes} disabled={disabled} rows={2}
              onChange={(e) => update(id, { nextEpisodeNotes: e.target.value })}
              placeholder="Setup, tone shifts, character changes to carry forward…"
              className={cn(fieldClass, 'resize-none')} />
          </label>

          {/* Save to series memory */}
          <button type="button" onClick={handleSave}
            disabled={disabled || !seriesId.trim()}
            className={cn(
              'nodrag flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-medium transition-all',
              'disabled:pointer-events-none disabled:opacity-50',
              saved
                ? 'bg-success/15 text-success border border-success/25'
                : 'bg-primary text-primary-foreground hover:opacity-90',
            )}>
            {saved
              ? <><Check className="size-4" />Saved to series memory</>
              : <><Save className="size-4" />Save episode to series memory</>
            }
          </button>
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>Episode {data.episodeNumber}{data.episodeTitle ? ` — ${data.episodeTitle}` : ''}</span>
          <span className="font-mono text-[10px]">{(data.characterSnapshots ?? []).length} characters</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
