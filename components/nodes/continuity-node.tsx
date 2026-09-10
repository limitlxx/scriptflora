'use client'

import { type NodeProps } from '@xyflow/react'
import {
  AlertTriangle, Check, CircleAlert, Info,
  Lock, LockOpen, Loader2, PlayCircle, ShieldCheck, Trash2, Wand2, X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ContinuityIssueSeverity, ContinuityIssue, ContinuityNode as ContinuityNodeType } from '@/lib/flow-types'
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

type CanvasNode = { id: string; type?: string; data: Record<string, unknown> }

function getCanvasNodes(): CanvasNode[] {
  return (window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] ?? []
}

function updateCanvasNode(id: string, patch: Record<string, unknown>) {
  ;(window as unknown as Record<string, unknown>).__ScriptFloraUpdateNode?.(id, patch)
}

/** Find the content node best matching the issue source label. */
function findTargetNode(source: string, allNodes: CanvasNode[]): CanvasNode | undefined {
  const s = source.toLowerCase()
  return allNodes.find((n) => {
    if (n.type !== 'content') return false
    const d = n.data as { label?: string; index?: number }
    const label = d.index != null ? `${d.label} ${d.index}` : d.label
    return label?.toLowerCase().includes(s)
  })
}

async function runContinuityCheck(
  nodeId: string,
  update: (id: string, patch: Record<string, unknown>) => void,
) {
  const allNodes = getCanvasNodes()
  const brief = allNodes.find((n) => n.type === 'brief')
  const contentNodes = allNodes.filter(
    (n) => n.type === 'content' && ((n.data as { content?: string }).content ?? '').trim(),
  )

  if (contentNodes.length < 2) {
    update(nodeId, {
      status: 'draft', score: 100, checkedAt: 'just now',
      issues: contentNodes.length === 0 ? [{
        id: 'no-content', severity: 'info',
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
    update(nodeId, { status: 'draft', score: result.score, checkedAt: 'just now', issues: result.issues })
  } catch {
    const issues: Array<{ id: string; severity: ContinuityIssueSeverity; message: string; source: string }> = []
    const keyFacts2 = ((brief?.data?.keyFacts as string[] | undefined) ?? []).filter(Boolean)
    for (const fact of keyFacts2) {
      const factWords = fact.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
      const mentioned = contentNodes.some((n) =>
        factWords.some((word) => ((n.data as { content?: string }).content ?? '').toLowerCase().includes(word))
      )
      if (!mentioned) {
        issues.push({ id: `fact-${fact.slice(0, 20)}`, severity: 'warning', message: `Key fact may be missing: "${fact}"`, source: 'brief' })
      }
    }
    update(nodeId, { status: 'draft', score: Math.max(40, 100 - issues.length * 15), checkedAt: 'just now', issues })
  }
}

export function ContinuityNode({ id, data, selected }: NodeProps<ContinuityNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  /** Which issue is currently being AI-fixed (by id) */
  const [fixing, setFixing] = useState<string | null>(null)

  const running = data.status === 'generating'
  const score = Math.round(data.score)
  const hasRun = data.checkedAt !== null

  const handleRun = async () => {
    setDismissed(new Set())
    update(id, { status: 'generating', score: 0, issues: [], checkedAt: null })
    await runContinuityCheck(id, update)
  }

  const dismissIssue = (issueId: string) => setDismissed((p) => new Set([...p, issueId]))

  /** Flag the most relevant content node as needing attention. */
  const flagForEdit = (issue: ContinuityIssue) => {
    const allNodes = getCanvasNodes()
    if (issue.source === 'brief') {
      allNodes
        .filter((n) => n.type === 'content' && !n.data.locked && !n.data.approved)
        .forEach((n) => updateCanvasNode(n.id, { status: 'error' }))
    } else {
      const target = findTargetNode(issue.source, allNodes)
      if (target) updateCanvasNode(target.id, { status: 'error' })
    }
    update(id, {
      issues: data.issues.filter((i) => i.id !== issue.id),
      score: Math.max(0, score - 5),
    })
  }

  /**
   * AI-assisted fix: call /api/continuity-fix for the section referenced by
   * the issue, then push the corrected text back to the content node.
   */
  const fixWithAI = async (issue: ContinuityIssue) => {
    const allNodes = getCanvasNodes()
    const brief = allNodes.find((n) => n.type === 'brief')
    const keyFacts = ((brief?.data?.keyFacts as string[] | undefined) ?? []).filter(Boolean)

    // Find target node — if key-fact issue, pick the first unlocked content node
    const target = issue.source === 'brief'
      ? allNodes.find((n) => n.type === 'content' && !n.data.locked && !n.data.approved)
      : findTargetNode(issue.source, allNodes)

    if (!target) {
      flagForEdit(issue)
      return
    }

    const d = target.data as { label?: string; index?: number; content?: string }
    const nodeLabel = d.index != null ? `${d.label} ${d.index}` : (d.label ?? 'Section')
    const content = d.content ?? ''

    setFixing(issue.id)
    updateCanvasNode(target.id, { status: 'generating' })

    try {
      const res = await fetch('/api/continuity-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeLabel, content, issue: issue.message, keyFacts }),
      })

      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Fix failed')
      const { fixed } = await res.json() as { fixed: string }

      updateCanvasNode(target.id, { content: fixed, status: 'draft' })

      // Remove the resolved issue from the list and bump score
      update(id, {
        issues: data.issues.filter((i) => i.id !== issue.id),
        score: Math.min(100, score + 5),
      })
    } catch {
      updateCanvasNode(target.id, { status: 'error' })
    } finally {
      setFixing(null)
    }
  }

  const visibleIssues = data.issues.filter((i) => !dismissed.has(i.id))

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={360}
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
            <ToolbarButton icon={Trash2} label="Delete node" tone="danger" onClick={() => act(id, 'delete')} />
          </>
        }
      >
        <NodeHeader icon={ShieldCheck} title="Continuity" subtitle="Cross-scene consistency" right={<StatusDot status={data.status} />} />
        <NodeDivider />

        {/* Score bar */}
        <div className="px-4 pt-3.5 pb-3">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-[10px] font-medium tracking-[0.06em] uppercase">Consistency</span>
            <span className="text-foreground font-mono text-[15px] leading-none tabular-nums">
              {running ? '—' : hasRun ? `${score}%` : '—'}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className={cn('h-full rounded-full transition-all duration-700 ease-out',
                score >= 90 ? 'bg-success' : score >= 70 ? 'bg-primary' : 'bg-warning',
                running && 'animate-pulse')}
              style={{ width: running ? '35%' : hasRun ? `${score}%` : '0%' }}
            />
          </div>
          {!hasRun && !running && (
            <button type="button" onClick={() => void handleRun()} disabled={Boolean(data.locked)}
              className="nodrag mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11.5px] font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-colors disabled:opacity-40 disabled:pointer-events-none">
              <PlayCircle className="size-3.5" /> Run check
            </button>
          )}
          {hasRun && !running && (
            <button type="button" onClick={() => void handleRun()} disabled={Boolean(data.locked)}
              className="nodrag mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10.5px] text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors disabled:opacity-40 disabled:pointer-events-none">
              <PlayCircle className="size-3" /> Re-run check
            </button>
          )}
        </div>

        <NodeDivider />

        {/* Issues list */}
        <div className="scroll-slim max-h-[280px] overflow-y-auto px-2 py-2">
          {running ? (
            <p className="text-muted-foreground px-2 py-3 text-[11.5px]">Comparing characters, props and key facts…</p>
          ) : !hasRun ? (
            <p className="text-muted-foreground px-2 py-3 text-[11.5px]">Click "Run check" to analyse your script.</p>
          ) : visibleIssues.length === 0 ? (
            <p className="text-success flex items-center gap-1.5 px-2 py-3 text-[11.5px]">
              <ShieldCheck className="size-3" />
              {data.issues.length > dismissed.size ? 'All issues dismissed.' : 'No continuity conflicts found.'}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {visibleIssues.map((issue) => {
                const sev = SEVERITY[issue.severity]
                const SevIcon = sev.icon
                const isFixing = fixing === issue.id
                return (
                  <li key={issue.id} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2.5">
                    <div className="flex gap-2">
                      <SevIcon className={cn('mt-px size-3 shrink-0', sev.className)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground/85 text-[11.5px] leading-snug">{issue.message}</p>
                        <span className="text-muted-foreground/70 mt-0.5 block font-mono text-[10px]">{issue.source}</span>
                      </div>
                    </div>
                    {/* Resolution actions */}
                    <div className="mt-2 flex items-center gap-1.5 pl-5">
                      <button
                        type="button"
                        onClick={() => void fixWithAI(issue)}
                        disabled={isFixing || Boolean(data.locked)}
                        className={cn(
                          'nodrag flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
                          'bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-40 disabled:pointer-events-none',
                        )}
                        title="AI rewrites the affected section to resolve this issue"
                      >
                        {isFixing
                          ? <><Loader2 className="size-2.5 animate-spin" />Fixing…</>
                          : <><Wand2 className="size-2.5" />Fix with AI</>
                        }
                      </button>
                      <button
                        type="button"
                        onClick={() => flagForEdit(issue)}
                        disabled={isFixing}
                        className="nodrag flex items-center gap-1 rounded-md px-2 py-1 text-[10px] transition-colors text-muted-foreground hover:text-foreground hover:bg-white/[0.06] disabled:opacity-40 disabled:pointer-events-none"
                        title="Flag the affected node for manual editing"
                      >
                        <Check className="size-2.5" /> Flag
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissIssue(issue.id)}
                        className="nodrag flex items-center gap-1 rounded-md px-2 py-1 text-[10px] transition-colors text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
                        title="Dismiss"
                      >
                        <X className="size-2.5" /> Dismiss
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{hasRun ? (visibleIssues.length === 0 ? 'All clear' : `${visibleIssues.length} item${visibleIssues.length === 1 ? '' : 's'}`) : 'Not run yet'}</span>
          <span className="font-mono tracking-tight">{data.checkedAt ?? ''}</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
