'use client'

import { type NodeProps } from '@xyflow/react'
import { LayoutGrid, Lock, LockOpen, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { OutputNode as OutputNodeType } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  NodeDivider,
  NodeFooter,
  NodeHeader,
  NodeShell,
  StatusDot,
  ToolbarButton,
  ToolbarDivider,
} from './node-shell'

export function OutputNode({ id, data, selected }: NodeProps<OutputNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const disabled = Boolean(data.locked)
  const enabledCount = data.formats.filter((f) => f.enabled).length

  const toggle = (formatId: string) => {
    update(id, {
      formats: data.formats.map((f) =>
        f.id === formatId ? { ...f, enabled: !f.enabled } : f,
      ),
    })
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={332}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton
              icon={RefreshCw}
              label="Rebuild formats"
              onClick={() => act(id, 'regenerate')}
              disabled={disabled || data.status === 'generating'}
              tone="accent"
            />
            <ToolbarButton
              icon={data.locked ? LockOpen : Lock}
              label={data.locked ? 'Unlock' : 'Lock'}
              active={data.locked}
              onClick={() => act(id, data.locked ? 'unlock' : 'lock')}
            />
            <ToolbarDivider />
            <ToolbarButton
              icon={Trash2}
              label="Delete node"
              tone="danger"
              onClick={() => act(id, 'delete')}
            />
          </>
        }
      >
        <NodeHeader
          icon={LayoutGrid}
          title="Multi-Format"
          subtitle="Render the same script many ways"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-1 px-2 py-2">
          {data.formats.map((format) => (
            <button
              key={format.id}
              type="button"
              role="switch"
              aria-checked={format.enabled}
              disabled={disabled}
              onClick={() => toggle(format.id)}
              className={cn(
                'nodrag flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                'hover:bg-white/[0.04] disabled:pointer-events-none',
              )}
            >
              <span
                className={cn(
                  'relative h-3.5 w-6 shrink-0 rounded-full transition-colors duration-200',
                  format.enabled ? 'bg-primary' : 'bg-white/[0.12]',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 size-2.5 rounded-full bg-white transition-all duration-200 ease-out',
                    format.enabled ? 'left-[13px]' : 'left-0.5',
                  )}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block text-[12px] leading-tight font-medium transition-colors duration-150',
                    format.enabled ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {format.label}
                </span>
                <span className="text-muted-foreground/70 mt-0.5 block text-[10.5px] leading-tight">
                  {format.description}
                </span>
              </span>
            </button>
          ))}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>
            {enabledCount} of {data.formats.length} enabled
          </span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
