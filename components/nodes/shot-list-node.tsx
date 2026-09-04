'use client'

import { type NodeProps } from '@xyflow/react'
import {
  Camera, Check, ChevronDown, ChevronUp,
  Clapperboard, Lock, LockOpen, Loader2, Trash2, X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ShotListNode as ShotListNodeType, Shot, ShotStatus } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider,
} from './node-shell'

const STATUS_STYLE: Record<ShotStatus, { label: string; cls: string }> = {
  pending:     { label: 'Pending',      cls: 'text-muted-foreground bg-white/[0.06]' },
  brief_ready: { label: 'Brief ready',  cls: 'text-primary bg-primary/10' },
  generated:   { label: 'Generated',    cls: 'text-primary bg-primary/10' },
  approved:    { label: 'Approved',     cls: 'text-success bg-success/10' },
  rejected:    { label: 'Rejected',     cls: 'text-destructive bg-destructive/10' },
}

function ShotCard({
  shot,
  disabled,
  onStatusChange,
}: {
  shot: Shot
  disabled: boolean
  onStatusChange: (status: ShotStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const s = STATUS_STYLE[shot.status]

  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-white/[0.06] font-mono text-[10px] text-muted-foreground">
          {shot.index}
        </span>
        <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-foreground/90">
          {shot.label}
        </span>
        <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium', s.cls)}>
          {s.label}
        </span>
        {!disabled && shot.status !== 'approved' && (
          <button
            type="button"
            onClick={() => onStatusChange('approved')}
            title="Approve shot"
            className="shrink-0 text-muted-foreground hover:text-success"
          >
            <Check className="size-3" />
          </button>
        )}
        {!disabled && shot.status === 'approved' && (
          <button
            type="button"
            onClick={() => onStatusChange('pending')}
            title="Unapprove"
            className="shrink-0 text-success hover:text-muted-foreground"
          >
            <Check className="size-3" />
          </button>
        )}
        {!disabled && shot.status !== 'rejected' && (
          <button
            type="button"
            onClick={() => onStatusChange('rejected')}
            title="Reject shot"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="size-3" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      </div>

      {open && (
        <div className="space-y-2 border-t border-white/[0.06] px-3 pb-3 pt-2.5 text-[11px]">
          {shot.camera && (
            <div>
              <span className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">Camera</span>
              <p className="mt-0.5 text-foreground/80 leading-snug">{shot.camera}</p>
            </div>
          )}
          {shot.action && (
            <div>
              <span className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">Action</span>
              <p className="mt-0.5 text-foreground/80 leading-snug">{shot.action}</p>
            </div>
          )}
          {shot.dialogue && (
            <div>
              <span className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">Dialogue</span>
              <p className="mt-0.5 text-foreground/80 leading-snug italic">{shot.dialogue}</p>
            </div>
          )}
          <div className="flex gap-4">
            {shot.durationTarget && (
              <div>
                <span className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">Duration</span>
                <p className="mt-0.5 text-foreground/80">{shot.durationTarget}</p>
              </div>
            )}
          </div>
          {shot.continuityNotes && (
            <div>
              <span className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">Continuity</span>
              <p className="mt-0.5 text-foreground/80 leading-snug">{shot.continuityNotes}</p>
            </div>
          )}
          {(shot.openingState || shot.endingState) && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">Opens on</span>
                <p className="mt-0.5 text-foreground/80 leading-snug">{shot.openingState}</p>
              </div>
              <div>
                <span className="text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">Ends on</span>
                <p className="mt-0.5 text-foreground/80 leading-snug">{shot.endingState}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ShotListNode({ id, data, selected }: NodeProps<ShotListNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [expanding, setExpanding] = useState(false)
  const [error, setError] = useState('')
  const disabled = Boolean(data.locked)

  const setShots = (shots: Shot[]) => update(id, { shots, status: shots.length > 0 ? 'draft' : 'empty' })

  const updateShotStatus = (shotId: string, status: ShotStatus) => {
    const shots = (data.shots ?? []).map((s) => s.id === shotId ? { ...s, status } : s)
    setShots(shots)
  }

  const handleExpand = async () => {
    // Read script content from canvas global — the upstream connected content node
    type CanvasNode = { id: string; type?: string; data: Record<string, unknown> }
    const allNodes = ((window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined) ?? []

    const brief = allNodes.find((n) => n.type === 'brief')
    // Find the most recent approved/draft content node as source
    const sourceNode = allNodes.find((n) => n.type === 'content' && (n.data.status === 'approved' || n.data.status === 'draft'))
    const biblNode = allNodes.find((n) => n.type === 'character-bible')
    const stylNode = allNodes.find((n) => n.type === 'style-lock')

    if (!sourceNode) {
      setError('No script content found. Generate a script first.')
      return
    }

    setExpanding(true)
    setError('')
    update(id, { status: 'generating' })

    const d = sourceNode.data as { content?: string; label?: string }
    const b = brief?.data as { title?: string; duration?: string; tone?: string; keyFacts?: string[] } | undefined
    const chars = (biblNode?.data as { characters?: Array<{ name: string; role: string; visualDescription: string; status: string }> } | undefined)
      ?.characters?.filter((c) => c.status === 'locked') ?? []
    const style = (stylNode?.data as { locked?: boolean; medium?: string; visualRules?: string; hardConstraints?: string } | undefined)

    try {
      const res = await fetch('/api/expand-shots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneContent: d.content ?? '',
          sceneLabel: data.sourceSceneLabel || d.label || 'Scene',
          brief: {
            title: b?.title ?? '',
            duration: b?.duration ?? '',
            tone: b?.tone ?? '',
            keyFacts: b?.keyFacts ?? [],
          },
          characters: chars.length > 0 ? chars : undefined,
          styleLock: style?.locked ? style : undefined,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        setError(body.error ?? 'Expansion failed.')
        update(id, { status: 'error' })
        return
      }

      const result = await res.json() as { shots: Shot[] }
      setShots(result.shots.map((s) => ({ ...s, sourceNodeId: sourceNode.id })))
      update(id, { sourceSceneLabel: d.label ?? 'Scene', status: 'draft' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Expansion failed.')
      update(id, { status: 'error' })
    } finally {
      setExpanding(false)
    }
  }

  const approvedCount = (data.shots ?? []).filter((s) => s.status === 'approved').length
  const totalCount = data.shots?.length ?? 0

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
            <ToolbarButton
              icon={data.locked ? LockOpen : Lock}
              label={data.locked ? 'Unlock' : 'Lock'}
              active={data.locked}
              onClick={() => act(id, data.locked ? 'unlock' : 'lock')}
            />
            <ToolbarDivider />
            <ToolbarButton icon={Trash2} label="Delete node" tone="danger" onClick={() => act(id, 'delete')} />
          </>
        }
      >
        <NodeHeader
          icon={Clapperboard}
          title="Shot List"
          subtitle={data.sourceSceneLabel ? `From: ${data.sourceSceneLabel}` : 'Shot / macro-state expander'}
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        {/* Expand CTA */}
        {!disabled && totalCount === 0 && (
          <div className="px-3 py-3">
            <button
              type="button"
              onClick={() => void handleExpand()}
              disabled={expanding}
              className={cn(
                'nodrag flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-medium transition-all',
                'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none',
              )}
            >
              {expanding
                ? <><Loader2 className="size-4 animate-spin" />Expanding shots…</>
                : <><Camera className="size-4" />Expand scene into shots</>
              }
            </button>
            {error && (
              <p className="mt-2 text-center text-[10.5px] text-destructive">{error}</p>
            )}
          </div>
        )}

        {/* Shot list */}
        {totalCount > 0 && (
          <>
            <div className="scroll-slim max-h-[440px] space-y-2 overflow-y-auto px-3 py-3">
              {(data.shots ?? []).map((shot) => (
                <ShotCard
                  key={shot.id}
                  shot={shot}
                  disabled={disabled}
                  onStatusChange={(status) => updateShotStatus(shot.id, status)}
                />
              ))}
            </div>
            {!disabled && (
              <div className="px-3 pb-3">
                <button
                  type="button"
                  onClick={() => void handleExpand()}
                  disabled={expanding}
                  className="nodrag flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] py-1.5 text-[11px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground disabled:opacity-40"
                >
                  {expanding ? <Loader2 className="size-3 animate-spin" /> : <Camera className="size-3" />}
                  Re-expand from script
                </button>
                {error && <p className="mt-1.5 text-center text-[10.5px] text-destructive">{error}</p>}
              </div>
            )}
          </>
        )}

        <NodeDivider />
        <NodeFooter>
          <span>{totalCount} shot{totalCount !== 1 ? 's' : ''}</span>
          <span className="font-mono text-[10px]">{approvedCount} approved</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
