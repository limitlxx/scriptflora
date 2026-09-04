'use client'

import { type NodeProps } from '@xyflow/react'
import {
  ArrowDown, ArrowUp, Film, Lock, LockOpen, RefreshCw, Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { SequenceNode as SequenceNodeType, ShotStatus, SequenceItem } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider,
} from './node-shell'

const STATUS_DOT: Record<ShotStatus, string> = {
  pending:     'bg-muted-foreground/40',
  brief_ready: 'bg-primary/60',
  generated:   'bg-primary',
  approved:    'bg-success',
  rejected:    'bg-destructive',
}

export function SequenceNode({ id, data, selected }: NodeProps<SequenceNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const disabled = Boolean(data.locked)

  const items = data.items ?? []

  // Sync sequence from all ShotListNodes on the canvas
  const handleSync = () => {
    type CanvasNode = {
      id: string
      type?: string
      data: {
        shots?: Array<{ id: string; label: string; status: ShotStatus }>
        sourceSceneLabel?: string
      }
    }
    const allNodes = ((window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined) ?? []
    const shotNodes = allNodes.filter((n) => n.type === 'shot-list')

    const newItems: SequenceItem[] = shotNodes.flatMap((n) =>
      (n.data.shots ?? []).map((s) => ({
        shotId: s.id,
        shotLabel: s.label,
        sourceNodeId: n.id,
        status: s.status,
      }))
    )

    update(id, {
      items: newItems,
      status: newItems.length > 0 ? 'draft' : 'empty',
    })
  }

  const moveItem = (index: number, dir: -1 | 1) => {
    const next = [...items]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    update(id, { items: next })
  }

  const approvedCount = items.filter((i) => i.status === 'approved').length
  const totalCount = items.length

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
            <ToolbarButton
              icon={RefreshCw}
              label="Sync from Shot Lists"
              onClick={handleSync}
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
          icon={Film}
          title="Sequence"
          subtitle="Shot order skeleton — no media yet"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        {items.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-[11px] text-muted-foreground">No shots yet.</p>
            <button
              type="button"
              onClick={handleSync}
              disabled={disabled}
              className="nodrag mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground disabled:opacity-40"
            >
              <RefreshCw className="size-3" />
              Sync from Shot Lists
            </button>
          </div>
        ) : (
          <div className="scroll-slim max-h-[400px] overflow-y-auto px-2 py-2">
            {items.map((item, i) => (
              <div
                key={item.shotId}
                className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.03]"
              >
                <span className="flex size-4 shrink-0 items-center justify-center font-mono text-[10px] text-muted-foreground/60">
                  {i + 1}
                </span>
                <span className={cn('size-2 shrink-0 rounded-full', STATUS_DOT[item.status])} />
                <span className="min-w-0 flex-1 truncate text-[11.5px] text-foreground/85">
                  {item.shotLabel}
                </span>
                {!disabled && (
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveItem(i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                      className="flex size-5 items-center justify-center rounded text-muted-foreground/50 hover:text-foreground disabled:opacity-20"
                    >
                      <ArrowUp className="size-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(i, 1)}
                      disabled={i === items.length - 1}
                      aria-label="Move down"
                      className="flex size-5 items-center justify-center rounded text-muted-foreground/50 hover:text-foreground disabled:opacity-20"
                    >
                      <ArrowDown className="size-2.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <NodeDivider />
        <NodeFooter>
          <span>{totalCount} shot{totalCount !== 1 ? 's' : ''} in sequence</span>
          <span className="font-mono text-[10px]">{approvedCount} approved</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
