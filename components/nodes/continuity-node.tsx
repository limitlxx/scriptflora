'use client'

import { type NodeProps } from '@xyflow/react'
import {
  AlertTriangle, CircleAlert, Info,
  Lock, LockOpen, PlayCircle, ShieldCheck, Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ContinuityIssueSeverity, ContinuityNode as ContinuityNodeType } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  NodeDivider, NodeFooter, NodeHeader, NodeShell,
  StatusDot, ToolbarButton, ToolbarDivider,
} from './node-shell'

const SEVERITY: Record<ContinuityIssueSeverity, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  error: { icon: CircleAlert, className: 'text-destructive' },
  warning: { icon: AlertTriangle, className: 'text-warning' },
  info: { icon: Info, className: 'text-muted-foreground' },
}

/**
 * Continuity checker: reads all canvas content nodes and checks for
 * consistency issues using a quick AI call via /api/generate.
 * Falls back to a simulated pass if not enough content exists.
 */
async function runContinuityCheck(
  nodeId: string,
  update: (id: string, patch: Record<string, unknown>) => void,
) {
  type CanvasNode = { type?: string; data: Record<string, unknown> }
  const allNodes = (
    (window as unknown as Record<string, unknown>).__scriptflowNodes as CanvasNode[] | undefined
  ) ?? []

  const brief = allNodes.find((n) => n.type === 'brief')
  const contentNodes = allNodes.filter(
    (n) => n.type === 'content' && ((n.data as { content?: string }).content ?? '').trim(),
  )

  if (contentNodes.length < 2) {
    // Not enough content — show simulated result
    update(nodeId, {
      status: 'draft',
      score: 100,
      checkedAt: 'just now',
      issues: contentNodes.length === 0 ? [{
        id: 'no-content',
        severity: 'info',
        message: 'No generated content to check yet. Generate script stages first.',
        source: 'canvas',
      }] : [],
    })
    return
  }

  const scriptText = contentNodes.map((n) => {
    const d = n.data as { label?: string; index?: number; content?: string }
    const heading = d.index != null ? `${d.label} ${d.index}` : d.label
    return `### ${heading}\n${d.content?.trim()}`
  }).join('\n\n')

  const keyFacts = ((brief?.data?.keyFacts as string[] | undefined) ?? []).filter(Boolean)

  try {
    const res = await fetch('/api/continuity-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: scriptText, keyFacts }),
    })

    if (!res.ok) throw new Error(await res.text())
    const result = await res.json() as {
      score: number
      issues: Array<{ id: string; severity: ContinuityIssueSeverity; message: string; source: string }>
    }

    update(nodeId, {
      status: 'draft',
      score: result.score,
      checkedAt: 'just now',
      issues: result.issues,
    })
  } catch {
    // Fallback: local heuristic check
    const issues: Array<{ id: string; severity: ContinuityIssueSeverity; message: string; source: string }> = []

    if (keyFacts.length > 0) {
      for (const fact of keyFacts) {
        const factWords = fact.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
        const mentioned = contentNodes.some((n) =>
          factWords.some((word) =>
            ((n.data as { content?: string }).content ?? '').toLowerCase().includes(word),
          ),
        )
        if (!mentioned) {
          issues.push({
            id: `fact-${fact.slice(0, 20)}`,
            severity: 'warning',
            message: `Key fact may be missing from the script: "${fact}"`,
            source: 'brief',
          })
        }
      }
    }

    const score = Math.max(40, 100 - issues.length * 15)
    update(nodeId, { status: 'draft', score, checkedAt: 'just now', issues })
  }
}

export function ContinuityNode({ id, data, selected }: NodeProps<ContinuityNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const running = data.status === 'generating'
  const score = Math.round(data.score)
  const hasRun = data.checkedAt !== null

  const handleRun = async () => {
    update(id, { status: 'generating', score: 0, issues: [], checkedAt: null })
    await runContinuityCheck(id, update)
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={336}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton
              icon={PlayCircle}
              label="Run continuity check"
              onClick={() => void handleRun()}
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

        {/* Score + run button */}
        <div className="px-4 pt-3.5 pb-3">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-[10px] font-medium tracking-[0.06em] uppercase">
              Consistency
            </span>
            <span className="text-foreground font-mono text-[15px] leading-none tabular-nums">
              {running ? '—' : hasRun ? `${score}%` : '—'}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                score >= 90 ? 'bg-success' : score >= 70 ? 'bg-primary' : 'bg-warning',
                running && 'animate-pulse',
              )}
              style={{ width: running ? '35%' : hasRun ? `${score}%` : '0%' }}
            />
          </div>

          {!hasRun && !running && (
            <button
              type="button"
              onClick={() => void handleRun()}
              disabled={Boolean(data.locked)}
              className={cn(
                'nodrag mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11.5px] font-medium',
                'bg-primary/15 text-primary hover:bg-primary/25 transition-colors disabled:opacity-40 disabled:pointer-events-none',
              )}
            >
              <PlayCircle className="size-3.5" />
              Run check
            </button>
          )}
        </div>

        <NodeDivider />

        {/* Issues list */}
        <div className="scroll-slim max-h-[188px] overflow-y-auto px-2 py-2">
          {running ? (
            <p className="text-muted-foreground px-2 py-3 text-[11.5px]">
              Comparing characters, props and key facts…
            </p>
          ) : !hasRun ? (
            <p className="text-muted-foreground px-2 py-3 text-[11.5px]">
              Click "Run check" to analyse your script for continuity issues.
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
                  <li key={issue.id} className="flex gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.04]">
                    <SevIcon className={cn('mt-px size-3 shrink-0', sev.className)} />
                    <div className="min-w-0">
                      <p className="text-foreground/85 text-[11.5px] leading-snug">{issue.message}</p>
                      <span className="text-muted-foreground/70 mt-1 block font-mono text-[10px]">{issue.source}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{hasRun ? (data.issues.length === 0 ? 'All clear' : `${data.issues.length} item${data.issues.length === 1 ? '' : 's'}`) : 'Not run yet'}</span>
          <span className="font-mono tracking-tight">{data.checkedAt ?? ''}</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
