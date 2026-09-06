'use client'

import { type NodeProps } from '@xyflow/react'
import {
  AlertTriangle, Check, CircleAlert, Info,
  Lock, LockOpen, Loader2, PlayCircle, ShieldCheck, Trash2, Wand2, X,
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

type CanvasNode = { id?: string; type?: string; data: Record<string, unknown> }

function getCanvasNodes(): CanvasNode[] {
  return ((window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined) ?? []
}

function buildScriptText(allNodes: CanvasNode[]): string {
  return allNodes
    .filter((n) => n.type === 'content' && ((n.data as { content?: string }).content ?? '').trim())
    .map((n) => {
      const d = n.data as { label?: string; index?: number; content?: string }
      return `### ${d.index != null ? `${d.label} ${d.index}` : d.label}\n${d.content?.trim()}`
    })
    .join('\n\n')
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

  const scriptText = buildScriptText(allNodes)
  const keyFacts = ((brief?.data?.keyFacts as string[] | undefined) ?? []).filter(Boolean)
  const briefContext = brief ? {
    title: brief.data.title, objective: brief.data.objective,
    audience: brief.data.audience, tone: brief.data.tone,
    platforms: brief.data.platforms, duration: brief.data.duration,
  } : null

  try {
    const res = await fetch('/api/continuity-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: scriptText, keyFacts, brief: briefContext }),
    })
    if (!res.ok) throw new Error(await res.text())
    const result = await res.json() as {
      score: number
      issues: Array<{ id: string; severity: ContinuityIssueSeverity; message: string; source: string }>
    }
    update(nodeId, { status: 'draft', score: result.score, checkedAt: 'just now', issues: result.issues })
  } catch {
    const issues: Array<{ id: string; severity: ContinuityIssueSeverity; message: string; source: string }> = []
    const kf = ((brief?.data?.keyFacts as string[] | undefined) ?? []).filter(Boolean)
    for (const fact of kf) {
      const words = fact.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
      const mentioned = contentNodes.some((n) =>
        words.some((word) => ((n.data as { content?: string }).content ?? '').toLowerCase().includes(word)),
      )
      if (!mentioned) issues.push({ id: `fact-${fact.slice(0, 20)}`, severity: 'warning', message: `Key fact may be missing: "${fact}"`, source: 'brief' })
    }
    update(nodeId, { status: 'draft', score: Math.max(40, 100 - issues.length * 15), checkedAt: 'just now', issues })
  }
}

// ── Issue row with Apply Fix ──────────────────────────────────────────────────

type IssueRowProps = {
  issue: { id: string; severity: ContinuityIssueSeverity; message: string; source: string }
}

function IssueRow({ issue }: IssueRowProps) {
  const { update } = useNodeActions()
  const [fixing, setFixing] = useState(false)
  const [proposal, setProposal] = useState<{ nodeId: string; nodeLabel: string; fixed: string } | null>(null)
  const [applied, setApplied] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const sev = SEVERITY[issue.severity]
  const SevIcon = sev.icon

  const handleFix = async () => {
    setFixing(true)
    setErr(null)
    setProposal(null)

    const allNodes = getCanvasNodes()
    const contentNodes = allNodes.filter(
      (n) => n.type === 'content' && ((n.data as { content?: string }).content ?? '').trim(),
    )

    // Find best matching node by source label (case-insensitive partial match)
    const sourceLower = issue.source.toLowerCase()
    const target = contentNodes.find((n) => {
      const d = n.data as { label?: string; index?: number }
      const label = d.index != null ? `${d.label} ${d.index}` : (d.label ?? '')
      return label.toLowerCase().includes(sourceLower) || sourceLower.includes((d.label ?? '').toLowerCase())
    }) ?? contentNodes[contentNodes.length - 1]  // fallback to last node

    if (!target) { setErr('No content node found to fix.'); setFixing(false); return }

    // Skip locked/approved nodes — hard rule
    const td = target.data as { locked?: boolean; approved?: boolean; label?: string; index?: number; content?: string }
    if (td.locked || td.approved) {
      setErr('Target node is locked or approved — unlock it first.')
      setFixing(false)
      return
    }

    const brief = allNodes.find((n) => n.type === 'brief')
    const keyFacts = ((brief?.data?.keyFacts as string[] | undefined) ?? []).filter(Boolean)
    const nodeLabel = td.index != null ? `${td.label} ${td.index}` : (td.label ?? 'Section')

    try {
      const res = await fetch('/api/continuity-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue,
          nodeId: target.id,
          nodeLabel,
          nodeContent: td.content ?? '',
          fullScript: buildScriptText(allNodes),
          keyFacts,
        }),
      })
      const body = await res.json() as { fixed?: string; error?: string }
      if (!res.ok || !body.fixed) throw new Error(body.error ?? 'Empty response')
      setProposal({ nodeId: target.id!, nodeLabel, fixed: body.fixed })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fix failed')
    } finally {
      setFixing(false)
    }
  }

  const acceptFix = () => {
    if (!proposal) return
    update(proposal.nodeId, { content: proposal.fixed, status: 'draft' })
    setProposal(null)
    setApplied(true)
  }

  return (
    <li className="rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.04]">
      <div className="flex gap-2">
        <SevIcon className={cn('mt-px size-3 shrink-0', sev.className)} />
        <div className="min-w-0 flex-1">
          <p className="text-foreground/85 text-[11.5px] leading-snug">{issue.message}</p>
          <span className="text-muted-foreground/70 mt-0.5 block font-mono text-[10px]">{issue.source}</span>

          {/* Apply fix button — only for error/warning */}
          {!applied && !proposal && issue.severity !== 'info' && (
            <button
              type="button"
              onClick={() => void handleFix()}
              disabled={fixing}
              className={cn(
                'nodrag mt-1.5 flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-medium transition-colors',
                'bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:pointer-events-none',
              )}
            >
              {fixing ? <Loader2 className="size-3 animate-spin" /> : <Wand2 className="size-3" />}
              {fixing ? 'Fixing…' : 'Apply fix'}
            </button>
          )}

          {applied && (
            <span className="mt-1 flex items-center gap-1 text-[10.5px] text-green-400">
              <Check className="size-3" /> Fix applied
            </span>
          )}

          {err && (
            <p className="mt-1 text-[10.5px] text-destructive">{err}</p>
          )}
        </div>
      </div>

      {/* Proposal review panel */}
      {proposal && (
        <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-primary/70">
            Proposed fix for "{proposal.nodeLabel}"
          </p>
          <p className="mb-2.5 whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/80 line-clamp-6">
            {proposal.fixed}
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={acceptFix}
              className="nodrag flex items-center gap-1 rounded-md bg-primary/20 px-2.5 py-1 text-[10.5px] font-medium text-primary hover:bg-primary/30 transition-colors"
            >
              <Check className="size-3" /> Accept
            </button>
            <button
              type="button"
              onClick={() => setProposal(null)}
              className="nodrag flex items-center gap-1 rounded-md bg-white/[0.05] px-2.5 py-1 text-[10.5px] text-muted-foreground hover:bg-white/[0.09] transition-colors"
            >
              <X className="size-3" /> Dismiss
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

// ── Main node ─────────────────────────────────────────────────────────────────

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
            <ToolbarButton icon={PlayCircle} label="Run continuity check" onClick={() => void handleRun()} disabled={running || Boolean(data.locked)} tone="accent" />
            <ToolbarButton icon={data.locked ? LockOpen : Lock} label={data.locked ? 'Unlock' : 'Lock'} active={data.locked} onClick={() => act(id, data.locked ? 'unlock' : 'lock')} />
            <ToolbarDivider />
            <ToolbarButton icon={Trash2} label="Delete node" tone="danger" onClick={() => act(id, 'delete')} />
          </>
        }
      >
        <NodeHeader icon={ShieldCheck} title="Continuity" subtitle="Cross-scene consistency" right={<StatusDot status={data.status} />} />
        <NodeDivider />

        <div className="px-4 pt-3.5 pb-3">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-[10px] font-medium tracking-[0.06em] uppercase">Consistency</span>
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
            <button type="button" onClick={() => void handleRun()} disabled={Boolean(data.locked)}
              className="nodrag mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11.5px] font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <PlayCircle className="size-3.5" /> Run check
            </button>
          )}
          {hasRun && !running && (
            <button type="button" onClick={() => void handleRun()} disabled={Boolean(data.locked)}
              className="nodrag mt-2 flex w-full items-center justify-center gap-1 text-[10.5px] text-muted-foreground/60 hover:text-muted-foreground transition-colors disabled:opacity-40"
            >
              <PlayCircle className="size-3" /> Re-run
            </button>
          )}
        </div>

        <NodeDivider />

        <div className="scroll-slim max-h-[320px] overflow-y-auto px-2 py-2">
          {running ? (
            <p className="text-muted-foreground px-2 py-3 text-[11.5px]">Comparing characters, props and key facts…</p>
          ) : !hasRun ? (
            <p className="text-muted-foreground px-2 py-3 text-[11.5px]">Click "Run check" to analyse your script.</p>
          ) : data.issues.length === 0 ? (
            <p className="text-success flex items-center gap-1.5 px-2 py-3 text-[11.5px]">
              <ShieldCheck className="size-3" /> No continuity conflicts found.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {data.issues.map((issue) => <IssueRow key={issue.id} issue={issue} />)}
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
