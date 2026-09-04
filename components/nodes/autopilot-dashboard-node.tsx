'use client'

import { type NodeProps } from '@xyflow/react'
import {
  AlertTriangle, DollarSign, Gauge, Lock, LockOpen,
  Pause, Play, RefreshCw, Square, Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type {
  AutopilotDashboardNode as AutopilotDashboardNodeType,
  AutopilotStatus,
  CheckpointFrequency,
} from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider,
} from './node-shell'

const FREQ_OPTIONS: { id: CheckpointFrequency; label: string }[] = [
  { id: 'every-shot',     label: 'Every shot' },
  { id: 'every-scene',    label: 'Every scene' },
  { id: 'every-5-shots',  label: 'Every 5 shots' },
  { id: 'every-10-shots', label: 'Every 10 shots' },
]

const STATUS_STYLE: Record<AutopilotStatus, { label: string; cls: string }> = {
  idle:        { label: 'Idle',              cls: 'text-muted-foreground' },
  running:     { label: 'Running',           cls: 'text-primary' },
  paused:      { label: 'Paused',            cls: 'text-warning' },
  checkpoint:  { label: 'Checkpoint — review required', cls: 'text-warning' },
  complete:    { label: 'Complete',          cls: 'text-success' },
}

// Determine whether to fire a checkpoint based on frequency setting
function shouldCheckpoint(freq: CheckpointFrequency, completedShots: number): boolean {
  if (freq === 'every-shot') return true
  if (freq === 'every-5-shots') return completedShots > 0 && completedShots % 5 === 0
  if (freq === 'every-10-shots') return completedShots > 0 && completedShots % 10 === 0
  // every-scene — ponytail: scene boundary detection needs Phase 6 episode memory
  // For now checkpoint every 5 shots as a safe fallback
  return completedShots > 0 && completedShots % 5 === 0
}

export function AutopilotDashboardNode({ id, data, selected }: NodeProps<AutopilotDashboardNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const disabled = Boolean(data.locked)

  const s = STATUS_STYLE[data.autopilotStatus]
  const progress = data.totalShots > 0 ? data.completedShots / data.totalShots : 0

  // Sync totals from canvas shot lists and result nodes
  const syncProgress = () => {
    type CanvasNode = { type?: string; data: Record<string, unknown> }
    const allNodes = ((window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined) ?? []

    const shots = allNodes
      .filter((n) => n.type === 'shot-list')
      .flatMap((n) => (n.data.shots ?? []) as Array<{ status: string }>)

    const results = allNodes.filter((n) => n.type === 'result')
    const approved = results.filter((n) => n.data.resultStatus === 'approved').length
    const rejected = results.filter((n) => n.data.resultStatus === 'rejected').length
    const generated = results.filter((n) =>
      n.data.resultStatus === 'generated' || n.data.resultStatus === 'in_review',
    ).length

    // Sum cost from result provenances
    const totalCost = results.reduce((sum, n) => {
      const cost = (n.data.provenance as { estimatedCost?: number } | undefined)?.estimatedCost ?? 0
      return sum + cost
    }, 0)

    // Count open continuity issues
    const contLog = allNodes.find((n) => n.type === 'continuity-log')
    const openIssues = ((contLog?.data?.entries ?? []) as Array<{ openThreads: string }>)
      .filter((e) => e.openThreads?.trim()).length

    const completed = approved + rejected + generated
    const total = Math.max(shots.length, completed, data.totalShots)

    update(id, {
      totalShots: total,
      completedShots: completed,
      approvedShots: approved,
      rejectedShots: rejected,
      totalCostEstimate: totalCost,
      openIssues,
    })

    // Check if we need to fire a checkpoint
    if (
      data.autopilotStatus === 'running' &&
      shouldCheckpoint(data.checkpointFrequency, completed)
    ) {
      update(id, { autopilotStatus: 'checkpoint', lastCheckpointAt: new Date().toISOString() })
    }
  }

  // Auto-sync while running
  useEffect(() => {
    if (data.autopilotStatus === 'running') {
      intervalRef.current = window.setInterval(syncProgress, 3000)
    }
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current) }
    // ponytail: syncProgress reads canvas state via window global, not React deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.autopilotStatus, data.checkpointFrequency])

  const start   = () => { syncProgress(); update(id, { autopilotStatus: 'running', status: 'generating' }) }
  const pause   = () => update(id, { autopilotStatus: 'paused', status: 'draft' })
  const resume  = () => { update(id, { autopilotStatus: 'running', status: 'generating' }) }
  const stop    = () => update(id, { autopilotStatus: 'idle', status: 'empty' })
  const proceed = () => update(id, { autopilotStatus: 'running', status: 'generating', lastCheckpointAt: new Date().toISOString() })

  const isIdle       = data.autopilotStatus === 'idle'
  const isRunning    = data.autopilotStatus === 'running'
  const isPaused     = data.autopilotStatus === 'paused'
  const isCheckpoint = data.autopilotStatus === 'checkpoint'
  const isComplete   = data.autopilotStatus === 'complete'

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={380}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton icon={RefreshCw} label="Sync progress" onClick={syncProgress} disabled={disabled} tone="accent" />
            <ToolbarDivider />
            <ToolbarButton icon={data.locked ? LockOpen : Lock} label={data.locked ? 'Unlock' : 'Lock'}
              active={data.locked} onClick={() => act(id, data.locked ? 'unlock' : 'lock')} />
            <ToolbarDivider />
            <ToolbarButton icon={Trash2} label="Delete node" tone="danger" onClick={() => act(id, 'delete')} />
          </>
        }
      >
        <NodeHeader
          icon={Gauge}
          title="Autopilot"
          subtitle="Batch generation with human gates"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3.5 px-4 py-3.5">
          {/* Status banner */}
          <div className={cn(
            'flex items-center justify-between rounded-xl border px-3 py-2.5',
            isCheckpoint ? 'border-warning/30 bg-warning/8' :
            isRunning    ? 'border-primary/25 bg-primary/8' :
            isComplete   ? 'border-success/25 bg-success/8' :
                           'border-white/[0.07] bg-black/20',
          )}>
            <span className={cn('text-[12px] font-medium', s.cls)}>
              {isRunning && <span className="mr-1.5 inline-block size-1.5 animate-ping rounded-full bg-primary align-middle" />}
              {s.label}
            </span>
            {data.currentBatchLabel && (
              <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">{data.currentBatchLabel}</span>
            )}
          </div>

          {/* Checkpoint gate */}
          {isCheckpoint && (
            <div className="rounded-xl border border-warning/30 bg-warning/8 px-3 py-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-3.5 shrink-0 text-warning" />
                <span className="text-[11.5px] font-medium text-warning">Checkpoint reached — review before continuing</span>
              </div>
              {data.lastCheckpointAt && (
                <p className="text-[10px] text-muted-foreground">
                  Paused at: {new Date(data.lastCheckpointAt).toLocaleString()}
                </p>
              )}
              <button type="button" onClick={proceed} disabled={disabled}
                className={cn(
                  'nodrag flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[11.5px] font-medium transition-all',
                  'bg-success/15 text-success hover:bg-success/25 border border-success/20 disabled:opacity-40 disabled:pointer-events-none',
                )}>
                <Play className="size-3.5" /> Continue next batch
              </button>
            </div>
          )}

          {/* Progress bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
              <span className="text-muted-foreground">Shots complete</span>
              <span className="font-mono text-foreground/80">{data.completedShots} / {data.totalShots}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div className={cn('h-full rounded-full transition-all duration-500',
                progress >= 1 ? 'bg-success' : isRunning ? 'bg-primary animate-pulse' : 'bg-primary')}
                style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground/60">
              <span>{data.approvedShots} approved</span>
              <span>{data.rejectedShots} rejected</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-black/20 px-2.5 py-2">
              <DollarSign className="size-3.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">Total cost</p>
                <p className="font-mono text-[12px] text-foreground/90">{data.totalCostEstimate} cr</p>
              </div>
            </div>
            <div className={cn(
              'flex items-center gap-2 rounded-lg border px-2.5 py-2',
              data.openIssues > 0 ? 'border-warning/25 bg-warning/8' : 'border-white/[0.07] bg-black/20',
            )}>
              <AlertTriangle className={cn('size-3.5 shrink-0', data.openIssues > 0 ? 'text-warning' : 'text-muted-foreground')} />
              <div>
                <p className="text-[10px] text-muted-foreground">Open issues</p>
                <p className={cn('font-mono text-[12px]', data.openIssues > 0 ? 'text-warning' : 'text-foreground/90')}>{data.openIssues}</p>
              </div>
            </div>
          </div>

          {/* Checkpoint frequency */}
          <div>
            <FieldLabel>Checkpoint frequency</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {FREQ_OPTIONS.map((opt) => (
                <button key={opt.id} type="button" disabled={disabled || isRunning}
                  aria-pressed={data.checkpointFrequency === opt.id}
                  onClick={() => update(id, { checkpointFrequency: opt.id })}
                  className={cn(
                    'nodrag rounded-lg border px-2.5 py-1 text-[11px] transition-all',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
                    data.checkpointFrequency === opt.id
                      ? 'border-primary/45 bg-accent-muted text-primary'
                      : 'border-white/[0.08] bg-black/20 text-muted-foreground hover:border-white/[0.15] hover:text-foreground',
                  )}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex gap-2">
            {isIdle && (
              <button type="button" onClick={start} disabled={disabled}
                className="nodrag flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-[11.5px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none">
                <Play className="size-3.5" /> Start autopilot
              </button>
            )}
            {isRunning && (
              <>
                <button type="button" onClick={pause} disabled={disabled}
                  className="nodrag flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] py-2 text-[11.5px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground disabled:opacity-40">
                  <Pause className="size-3.5" /> Pause
                </button>
                <button type="button" onClick={stop} disabled={disabled}
                  className="nodrag flex items-center justify-center gap-1.5 rounded-xl border border-destructive/25 px-3 py-2 text-[11.5px] text-destructive hover:bg-destructive/10 disabled:opacity-40">
                  <Square className="size-3.5" />
                </button>
              </>
            )}
            {isPaused && (
              <>
                <button type="button" onClick={resume} disabled={disabled}
                  className="nodrag flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-[11.5px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none">
                  <Play className="size-3.5" /> Resume
                </button>
                <button type="button" onClick={stop} disabled={disabled}
                  className="nodrag flex items-center justify-center rounded-xl border border-white/[0.08] px-3 py-2 text-[11.5px] text-muted-foreground hover:bg-white/[0.05] disabled:opacity-40">
                  <Square className="size-3.5" />
                </button>
              </>
            )}
            {isComplete && (
              <button type="button" onClick={stop} disabled={disabled}
                className="nodrag flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] py-2 text-[11.5px] text-muted-foreground hover:bg-white/[0.05]">
                <RefreshCw className="size-3.5" /> Reset
              </button>
            )}
          </div>

          <button type="button" onClick={syncProgress} disabled={disabled}
            className="nodrag flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] py-1.5 text-[10.5px] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground disabled:opacity-40">
            <RefreshCw className="size-3" /> Sync progress from canvas
          </button>
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{Math.round(progress * 100)}% complete</span>
          <span className="font-mono text-[10px]">{data.totalCostEstimate} credits total</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
