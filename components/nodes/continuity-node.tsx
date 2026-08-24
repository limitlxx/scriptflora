'use client'

import { type NodeProps } from '@xyflow/react'
import {
  AlertTriangle,
  CircleAlert,
  Info,
  Lock,
  LockOpen,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type {
  ContinuityIssueSeverity,
  ContinuityNode as ContinuityNodeType,
} from '@/lib/flow-types'
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

const SEVERITY: Record<
  ContinuityIssueSeverity,
  { icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  error: { icon: CircleAlert, className: 'text-destructive' },
  warning: { icon: AlertTriangle, className: 'text-warning' },
  info: { icon: Info, className: 'text-muted-foreground' },
}

export function ContinuityNode({
  id,
  data,
  selected,
}: NodeProps<ContinuityNodeType>) {
  const { act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const running = data.status === 'generating'
  const score = Math.round(data.score)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={336}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton
              icon={RefreshCw}
              label="Re-run continuity check"
              onClick={() => act(id, 'regenerate')}
              disabled={running || Boolean(data.locked)}
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
          icon={ShieldCheck}
          title="Continuity"
          subtitle="Cross-scene consistency"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        {/* score */}
        <div className="px-4 pt-3.5 pb-3">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-[10px] font-medium tracking-[0.06em] uppercase">
              Consistency
            </span>
            <span className="text-foreground font-mono text-[15px] leading-none tabular-nums">
              {running ? '—' : `${score}%`}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                score >= 90
                  ? 'bg-success'
                  : score >= 70
                    ? 'bg-primary'
                    : 'bg-warning',
                running && 'animate-pulse',
              )}
              style={{ width: running ? '35%' : `${score}%` }}
            />
          </div>
        </div>

        <NodeDivider />

        {/* issues */}
        <div className="scroll-slim max-h-[188px] overflow-y-auto px-2 py-2">
          {running ? (
            <p className="text-muted-foreground px-2 py-3 text-[11.5px]">
              Comparing characters, props and timeline…
            </p>
          ) : data.issues.length === 0 ? (
            <p className="text-success flex items-center gap-1.5 px-2 py-3 text-[11.5px]">
              <ShieldCheck className="size-3" />
              No continuity conflicts found.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {data.issues.map((issue) => {
                const sev = SEVERITY[issue.severity]
                const SevIcon = sev.icon
                return (
                  <li
                    key={issue.id}
                    className="flex gap-2 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-white/[0.04]"
                  >
                    <SevIcon
                      className={cn('mt-px size-3 shrink-0', sev.className)}
                    />
                    <div className="min-w-0">
                      <p className="text-foreground/85 text-[11.5px] leading-snug">
                        {issue.message}
                      </p>
                      <span className="text-muted-foreground/70 mt-1 block font-mono text-[10px]">
                        {issue.source}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>
            {data.issues.length === 0
              ? 'All clear'
              : `${data.issues.length} item${data.issues.length === 1 ? '' : 's'}`}
          </span>
          <span className="font-mono tracking-tight">
            {data.checkedAt ?? 'never run'}
          </span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
