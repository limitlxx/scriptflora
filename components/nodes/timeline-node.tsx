'use client'

import { type NodeProps } from '@xyflow/react'
import {
  ArrowDown, ArrowUp, Film, Lock, LockOpen,
  Pause, Play, RefreshCw, Scissors, Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import { cn } from '@/lib/utils'
import type { TimelineNode as TimelineNodeType, TimelineClip } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider,
} from './node-shell'

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function ClipRow({
  clip,
  index,
  total,
  disabled,
  onMove,
  onUpdate,
  onRemove,
}: {
  clip: TimelineClip
  index: number
  total: number
  disabled: boolean
  onMove: (dir: -1 | 1) => void
  onUpdate: (patch: Partial<TimelineClip>) => void
  onRemove: () => void
}) {
  return (
    <div className="group flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-2 transition-colors hover:border-white/[0.10]">
      {/* Order number */}
      <span className="flex size-5 shrink-0 items-center justify-center font-mono text-[10px] text-muted-foreground/60">
        {index + 1}
      </span>

      {/* Thumbnail */}
      <div className="size-9 shrink-0 overflow-hidden rounded-md bg-white/[0.06]">
        {clip.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clip.thumbnailUrl} alt={clip.label} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Film className="size-3.5 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Label + duration */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11.5px] font-medium text-foreground/90">{clip.label}</p>
        <p className="text-[10px] text-muted-foreground/60">{formatDuration(clip.durationSeconds)}</p>
      </div>

      {/* Transition toggle */}
      {index < total - 1 && (
        <button
          type="button"
          disabled={disabled}
          title={`Transition: ${clip.transition}`}
          onClick={() => onUpdate({ transition: clip.transition === 'cut' ? 'fade' : 'cut' })}
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-medium transition-colors disabled:pointer-events-none',
            clip.transition === 'fade'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground/50 hover:text-foreground',
          )}
        >
          {clip.transition === 'fade' ? 'Fade' : 'Cut'}
        </button>
      )}

      {/* Move up / down */}
      {!disabled && (
        <div className="flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Move clip up"
            className="flex size-4 items-center justify-center rounded text-muted-foreground/40 hover:text-foreground disabled:opacity-20"
          >
            <ArrowUp className="size-2.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label="Move clip down"
            className="flex size-4 items-center justify-center rounded text-muted-foreground/40 hover:text-foreground disabled:opacity-20"
          >
            <ArrowDown className="size-2.5" />
          </button>
        </div>
      )}

      {/* Remove */}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove clip"
          className="shrink-0 text-muted-foreground/30 hover:text-destructive"
        >
          <Trash2 className="size-3" />
        </button>
      )}
    </div>
  )
}

export function TimelineNode({ id, data, selected }: NodeProps<TimelineNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const disabled = Boolean(data.locked)
  const clips = data.clips ?? []

  // Sync approved result nodes into the timeline
  const syncFromResults = useCallback(() => {
    type CanvasNode = {
      id: string
      type?: string
      data: {
        resultStatus?: string
        videoUrl?: string
        audioUrl?: string
        thumbnailUrl?: string
        provenance?: { brief?: { shotLabel?: string; durationTarget?: string } }
      }
    }
    const allNodes = ((window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined) ?? []
    const approved = allNodes.filter((n) => n.type === 'result' && n.data.resultStatus === 'approved')

    // Keep existing clips for approved results already in the timeline, add new ones
    const existingIds = new Set(clips.map((c) => c.resultNodeId))
    const newClips: TimelineClip[] = approved
      .filter((n) => !existingIds.has(n.id))
      .map((n, i) => {
        const brief = n.data.provenance?.brief
        const label = brief?.shotLabel ?? `Shot ${clips.length + i + 1}`
        const durStr = brief?.durationTarget ?? '5 seconds'
        const durMatch = durStr.match(/(\d+)/)
        const dur = durMatch ? parseInt(durMatch[1], 10) : 5
        return {
          id: nanoid(8),
          resultNodeId: n.id,
          label,
          videoUrl: n.data.videoUrl,
          audioUrl: n.data.audioUrl,
          thumbnailUrl: n.data.thumbnailUrl,
          durationSeconds: dur,
          trimStart: 0,
          trimEnd: 0,
          transition: 'cut' as const,
          order: clips.length + i,
        }
      })

    const merged = [...clips, ...newClips].map((c, i) => ({ ...c, order: i }))
    const total = merged.reduce((sum, c) => sum + c.durationSeconds, 0)
    update(id, { clips: merged, totalDuration: total, status: merged.length > 0 ? 'draft' : 'empty' })
  }, [clips, id, update])

  const moveClip = (index: number, dir: -1 | 1) => {
    const next = [...clips]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    update(id, { clips: next.map((c, i) => ({ ...c, order: i })) })
  }

  const updateClip = (index: number, patch: Partial<TimelineClip>) => {
    const next = clips.map((c, i) => i === index ? { ...c, ...patch } : c)
    const total = next.reduce((sum, c) => sum + c.durationSeconds, 0)
    update(id, { clips: next, totalDuration: total })
  }

  const removeClip = (index: number) => {
    const next = clips.filter((_, i) => i !== index).map((c, i) => ({ ...c, order: i }))
    const total = next.reduce((sum, c) => sum + c.durationSeconds, 0)
    update(id, { clips: next, totalDuration: total, status: next.length > 0 ? 'draft' : 'empty' })
  }

  // Rough-cut preview: advance through clips
  const currentClip = clips[currentIndex]

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    const onEnded = () => {
      if (currentIndex < clips.length - 1) {
        setCurrentIndex((i) => i + 1)
      } else {
        setIsPlaying(false)
        setCurrentIndex(0)
      }
    }
    vid.addEventListener('ended', onEnded)
    return () => vid.removeEventListener('ended', onEnded)
  }, [currentIndex, clips.length])

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    if (currentClip?.videoUrl) {
      vid.src = currentClip.videoUrl
      if (isPlaying) void vid.play().catch(() => {})
    }
  }, [currentIndex, currentClip, isPlaying])

  const togglePlay = () => {
    const vid = videoRef.current
    if (!vid) return
    if (isPlaying) {
      vid.pause()
      setIsPlaying(false)
    } else {
      if (currentIndex >= clips.length) setCurrentIndex(0)
      void vid.play().catch(() => {})
      setIsPlaying(true)
    }
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
            <ToolbarButton icon={RefreshCw} label="Sync from approved results" onClick={syncFromResults} disabled={disabled} tone="accent" />
            <ToolbarDivider />
            <ToolbarButton icon={data.locked ? LockOpen : Lock} label={data.locked ? 'Unlock' : 'Lock'} active={data.locked} onClick={() => act(id, data.locked ? 'unlock' : 'lock')} />
            <ToolbarDivider />
            <ToolbarButton icon={Trash2} label="Delete node" tone="danger" onClick={() => act(id, 'delete')} />
          </>
        }
      >
        <NodeHeader
          icon={Scissors}
          title="Timeline"
          subtitle="Rough-cut assembly"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        {/* Rough-cut preview player */}
        <div className="px-3 pt-3">
          <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-black">
            {currentClip?.videoUrl ? (
              <video
                ref={videoRef}
                className="aspect-video w-full object-contain"
                aria-label={`Preview: ${currentClip.label}`}
                playsInline
              />
            ) : (
              <div className="flex aspect-video items-center justify-center">
                <Film className="size-8 text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Player controls */}
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              disabled={clips.length === 0}
              className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25 disabled:opacity-30"
              aria-label={isPlaying ? 'Pause' : 'Play rough cut'}
            >
              {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-foreground/70">
                {clips.length === 0
                  ? 'No clips yet — sync from approved results'
                  : `${currentIndex + 1}/${clips.length} · ${currentClip?.label ?? ''}`}
              </p>
            </div>
            <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">
              {formatDuration(data.totalDuration ?? 0)}
            </span>
          </div>
        </div>

        <NodeDivider />

        {/* Clip list */}
        {clips.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-[11px] text-muted-foreground">
              No clips. Sync approved result nodes to build the timeline.
            </p>
            <button
              type="button"
              onClick={syncFromResults}
              className="nodrag mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
            >
              <RefreshCw className="size-3" />
              Sync approved results
            </button>
          </div>
        ) : (
          <div className="scroll-slim max-h-[360px] space-y-1.5 overflow-y-auto px-3 py-3">
            {clips.map((clip, i) => (
              <ClipRow
                key={clip.id}
                clip={clip}
                index={i}
                total={clips.length}
                disabled={disabled}
                onMove={(dir) => moveClip(i, dir)}
                onUpdate={(patch) => updateClip(i, patch)}
                onRemove={() => removeClip(i)}
              />
            ))}
          </div>
        )}

        <NodeDivider />
        <NodeFooter>
          <span>{clips.length} clip{clips.length !== 1 ? 's' : ''}</span>
          <span className="font-mono text-[10px]">{formatDuration(data.totalDuration ?? 0)} total</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
