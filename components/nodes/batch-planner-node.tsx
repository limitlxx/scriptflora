'use client'

import { type NodeProps } from '@xyflow/react'
import {
  Check, ChevronDown, ChevronUp, Layers, Loader2,
  Lock, LockOpen, Sparkles, Trash2, X,
} from 'lucide-react'
import { useState } from 'react'
import { nanoid } from 'nanoid'
import { cn } from '@/lib/utils'
import type { BatchPlannerNode as BatchPlannerNodeType, BatchItem } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'

export function BatchPlannerNode({ id, data, selected }: NodeProps<BatchPlannerNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [proposing, setProposing] = useState(false)
  const [error, setError] = useState('')
  const disabled = Boolean(data.locked)

  const items = data.items ?? []
  const approvedCount = items.filter((i) => i.approved).length
  const allApproved = items.length > 0 && items.every((i) => i.approved || i.rejected)

  // Ask the Director (ChatGPT) to propose the next batch of shots
  const handlePropose = async () => {
    setProposing(true)
    setError('')
    update(id, { status: 'generating', planApproved: false })

    type CanvasNode = { type?: string; data: Record<string, unknown> }
    const allNodes = ((window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined) ?? []
    const brief = allNodes.find((n) => n.type === 'brief')
    const contLog = allNodes.find((n) => n.type === 'continuity-log')
    const shotLists = allNodes.filter((n) => n.type === 'shot-list')

    // Count already generated / approved shots to know where we are
    const existingShots = shotLists.flatMap((n) =>
      ((n.data.shots ?? []) as Array<{ status: string; label: string }>)
        .filter((s) => s.status === 'generated' || s.status === 'approved')
    )

    const prompt = [
      `Project: ${brief?.data?.title ?? 'Untitled'}`,
      `Objective: ${brief?.data?.objective ?? ''}`,
      `Completed shots so far: ${existingShots.length}`,
      `Continuity threads open: ${((contLog?.data?.entries ?? []) as Array<{ openThreads: string }>).filter((e) => e.openThreads?.trim()).length}`,
      `\nPropose the next ${data.batchSize} shots. For each shot give: a short label and a one-sentence rationale.`,
      `Return ONLY JSON: {"rationale":"string","shots":[{"label":"string","rationale":"string"}]}`,
    ].join('\n')

    try {
      const res = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: prompt }),
      })

      // ponytail: reuse generate-brief as a freeform ChatGPT call.
      // Ceiling: generate-brief expects brief shape; here we use it as a
      // general ChatGPT proxy. Upgrade path: add a /api/director-plan route.
      if (!res.ok) {
        // Fallback: generate placeholder items so the user can still plan manually
        const placeholders: BatchItem[] = Array.from({ length: data.batchSize }, (_, i) => ({
          id: nanoid(8),
          index: existingShots.length + i + 1,
          label: `Shot ${existingShots.length + i + 1}`,
          rationale: 'Add rationale',
          approved: false,
          rejected: false,
        }))
        update(id, { items: placeholders, directorRationale: 'Plan manually below.', status: 'draft' })
        return
      }

      // Try to parse a structured proposal from the response
      const raw = await res.json() as Record<string, unknown>
      // The generate-brief endpoint returns a brief shape; we'll check if the
      // model put our JSON in additionalNotes (common when the prompt is freeform)
      const jsonStr = (raw.additionalNotes as string | undefined) ?? ''
      let parsed: { rationale?: string; shots?: Array<{ label: string; rationale: string }> } = {}
      try { parsed = JSON.parse(jsonStr) } catch { /* use fallback */ }

      const shots = parsed.shots ?? Array.from({ length: data.batchSize }, (_, i) => ({
        label: `Shot ${existingShots.length + i + 1}`,
        rationale: 'Review and adjust',
      }))

      const newItems: BatchItem[] = shots.slice(0, data.batchSize).map((s, i) => ({
        id: nanoid(8),
        index: existingShots.length + i + 1,
        label: s.label,
        rationale: s.rationale,
        approved: false,
        rejected: false,
      }))

      update(id, {
        items: newItems,
        directorRationale: parsed.rationale ?? 'Director proposed this batch.',
        status: 'draft',
        planApproved: false,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Proposal failed.')
      update(id, { status: 'error' })
    } finally {
      setProposing(false)
    }
  }

  const updateItem = (idx: number, patch: Partial<BatchItem>) => {
    const next = items.map((it, i) => i === idx ? { ...it, ...patch } : it)
    update(id, { items: next })
  }

  const approvePlan = () => update(id, { planApproved: true, status: 'approved' })
  const resetPlan  = () => update(id, { items: [], planApproved: false, status: 'empty' })

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={400}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton icon={Sparkles} label="Propose batch" tone="accent"
              onClick={() => void handlePropose()} disabled={disabled || proposing} />
            <ToolbarDivider />
            <ToolbarButton icon={data.locked ? LockOpen : Lock} label={data.locked ? 'Unlock' : 'Lock'}
              active={data.locked} onClick={() => act(id, data.locked ? 'unlock' : 'lock')} />
            <ToolbarDivider />
            <ToolbarButton icon={Trash2} label="Delete node" tone="danger" onClick={() => act(id, 'delete')} />
          </>
        }
      >
        <NodeHeader
          icon={Layers}
          title="Batch Planner"
          subtitle="Director proposes next N shots"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3 px-4 py-3.5">
          {/* Batch size */}
          <div className="flex items-center gap-3">
            <label className="flex-1 block">
              <FieldLabel>Shots per batch</FieldLabel>
              <input type="number" min={1} max={20} value={data.batchSize} disabled={disabled}
                onChange={(e) => update(id, { batchSize: Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 5)) })}
                className={cn(fieldClass, 'w-20 text-center')} />
            </label>
            <button type="button" onClick={() => void handlePropose()} disabled={disabled || proposing}
              className={cn(
                'nodrag mt-5 flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[11.5px] font-medium transition-all',
                'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none',
              )}
            >
              {proposing ? <><Loader2 className="size-3.5 animate-spin" />Proposing…</> : <><Sparkles className="size-3.5" />Propose</>}
            </button>
          </div>

          {/* Director rationale */}
          {data.directorRationale && (
            <div className="rounded-lg border border-primary/20 bg-primary/8 px-3 py-2">
              <p className="text-[10.5px] text-primary/80 leading-snug">{data.directorRationale}</p>
            </div>
          )}

          {/* Items */}
          {items.length > 0 && (
            <div className="space-y-1.5">
              {items.map((item, i) => (
                <BatchItemRow key={item.id} item={item} disabled={disabled}
                  onChange={(patch) => updateItem(i, patch)} />
              ))}
            </div>
          )}

          {/* Error */}
          {error && <p className="text-center text-[10.5px] text-destructive">{error}</p>}

          {/* Approve plan */}
          {items.length > 0 && !data.planApproved && (
            <div className="flex gap-2">
              <button type="button" onClick={approvePlan} disabled={disabled}
                className={cn(
                  'nodrag flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[11.5px] font-medium transition-all',
                  'bg-success/15 text-success hover:bg-success/25 border border-success/20 disabled:opacity-40 disabled:pointer-events-none',
                )}
              >
                <Check className="size-3.5" />
                Approve plan — unlock generation
              </button>
              <button type="button" onClick={resetPlan} disabled={disabled}
                className="nodrag rounded-xl border border-white/[0.08] px-3 text-[11px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground disabled:opacity-40"
              >
                Reset
              </button>
            </div>
          )}

          {data.planApproved && (
            <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-3 py-2">
              <Check className="size-3.5 shrink-0 text-success" />
              <span className="text-[11.5px] font-medium text-success">Plan approved — generation unlocked</span>
              {!disabled && (
                <button type="button" onClick={resetPlan}
                  className="ml-auto text-[10.5px] text-muted-foreground hover:text-foreground">
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{items.length} shots proposed</span>
          <span className="font-mono text-[10px]">{approvedCount} approved</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}

function BatchItemRow({
  item, disabled, onChange,
}: {
  item: BatchItem
  disabled: boolean
  onChange: (patch: Partial<BatchItem>) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className={cn(
      'rounded-xl border transition-all',
      item.approved ? 'border-success/25 bg-success/5'
        : item.rejected ? 'border-white/[0.05] bg-black/10 opacity-50'
        : 'border-white/[0.07] bg-black/20',
    )}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="font-mono text-[10px] text-muted-foreground/60 shrink-0">{item.index}</span>
        <input value={item.label} disabled={disabled || item.rejected}
          onChange={(e) => onChange({ label: e.target.value })}
          className="min-w-0 flex-1 bg-transparent text-[11.5px] font-medium text-foreground/90 outline-none placeholder:text-muted-foreground/50 disabled:cursor-default" />
        <button type="button" disabled={disabled} onClick={() => onChange({ approved: !item.approved, rejected: false })}
          title={item.approved ? 'Unapprove' : 'Approve'}
          className={cn('shrink-0 transition-colors', item.approved ? 'text-success' : 'text-muted-foreground/40 hover:text-success')}>
          <Check className="size-3" />
        </button>
        <button type="button" disabled={disabled} onClick={() => onChange({ rejected: !item.rejected, approved: false })}
          title={item.rejected ? 'Un-reject' : 'Reject'}
          className={cn('shrink-0 transition-colors', item.rejected ? 'text-destructive' : 'text-muted-foreground/40 hover:text-destructive')}>
          <X className="size-3" />
        </button>
        <button type="button" onClick={() => setOpen((v) => !v)}
          className="shrink-0 text-muted-foreground/40 hover:text-foreground">
          {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/[0.06] px-3 pb-2.5 pt-2">
          <FieldLabel>Director rationale</FieldLabel>
          <textarea value={item.rationale} disabled={disabled || item.rejected}
            onChange={(e) => onChange({ rationale: e.target.value })}
            rows={2} className={cn(fieldClass, 'resize-none text-[11px]')} />
        </div>
      )}
    </div>
  )
}
