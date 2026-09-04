'use client'

import { type NodeProps } from '@xyflow/react'
import { Check, Flag, Lock, LockOpen, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { CheckpointNode as CheckpointNodeType } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'

export function CheckpointNode({ id, data, selected }: NodeProps<CheckpointNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const disabled = Boolean(data.locked)

  // Sync approval count from connected result nodes on the canvas
  const syncApprovals = () => {
    type CanvasNode = { type?: string; data: { resultStatus?: string } }
    const allNodes = ((window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined) ?? []
    const approved = allNodes.filter((n) => n.type === 'result' && n.data.resultStatus === 'approved').length
    update(id, {
      currentApprovals: approved,
      gateOpen: approved >= data.requiredApprovals,
      status: approved >= data.requiredApprovals ? 'approved' : 'draft',
    })
  }

  const openGate = () => update(id, { gateOpen: true, status: 'approved' })
  const closeGate = () => update(id, { gateOpen: false, status: 'draft' })

  const progress = data.requiredApprovals > 0
    ? Math.min(1, data.currentApprovals / data.requiredApprovals)
    : 0

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={340}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton
              icon={RefreshCw}
              label="Sync approvals from canvas"
              onClick={syncApprovals}
              disabled={disabled}
              tone="accent"
            />
            <ToolbarDivider />
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
          icon={Flag}
          title="Checkpoint"
          subtitle="Human gate — approve before next batch"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3 px-4 py-3.5">
          {/* Label */}
          <label className="block">
            <FieldLabel>Checkpoint label</FieldLabel>
            <input
              value={data.label}
              disabled={disabled}
              onChange={(e) => update(id, { label: e.target.value })}
              placeholder="e.g. Scene 1 complete"
              className={fieldClass}
            />
          </label>

          {/* Required approvals */}
          <div>
            <FieldLabel>Required approvals to open gate</FieldLabel>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={data.requiredApprovals}
                disabled={disabled}
                onChange={(e) => update(id, { requiredApprovals: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                className={cn(fieldClass, 'w-20 text-center')}
              />
              <span className="text-[11.5px] text-muted-foreground">
                shots must be approved
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
              <span className="text-muted-foreground">Approvals</span>
              <span className="font-mono text-foreground/80">
                {data.currentApprovals} / {data.requiredApprovals}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  progress >= 1 ? 'bg-success' : 'bg-primary',
                )}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>

          {/* Gate status */}
          <div className={cn(
            'flex items-center justify-between rounded-xl border px-3 py-2.5 transition-all',
            data.gateOpen
              ? 'border-success/30 bg-success/10'
              : 'border-white/[0.08] bg-black/20',
          )}>
            <span className={cn('text-[12px] font-medium', data.gateOpen ? 'text-success' : 'text-muted-foreground')}>
              {data.gateOpen ? '✓ Gate open — next batch can run' : 'Gate closed — awaiting approvals'}
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={data.gateOpen ? closeGate : openGate}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[10.5px] font-medium transition-colors',
                  data.gateOpen
                    ? 'text-muted-foreground hover:bg-white/[0.06]'
                    : 'bg-success/15 text-success hover:bg-success/25',
                )}
              >
                {data.gateOpen ? 'Close' : 'Open manually'}
              </button>
            )}
          </div>

          {/* Sync button */}
          <button
            type="button"
            onClick={syncApprovals}
            disabled={disabled}
            className="nodrag flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground disabled:opacity-40"
          >
            <RefreshCw className="size-3" />
            Sync approvals from canvas
          </button>

          {/* Director notes for next batch */}
          <label className="block">
            <FieldLabel>Notes for next batch</FieldLabel>
            <textarea
              value={data.notes}
              disabled={disabled}
              onChange={(e) => update(id, { notes: e.target.value })}
              placeholder="Instructions, changes, or direction for the next generation run…"
              rows={3}
              className={cn(fieldClass, 'resize-none')}
            />
          </label>
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{data.label || 'Unnamed checkpoint'}</span>
          <span className={cn('font-mono text-[10px]', data.gateOpen ? 'text-success' : 'text-muted-foreground')}>
            {data.gateOpen ? 'Open' : 'Closed'}
          </span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
