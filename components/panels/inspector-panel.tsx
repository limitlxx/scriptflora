'use client'

/**
 * Feature P1 — Node Inspector panel.
 * Shows properties of the currently selected node.
 * Docks right by default; can detach to float.
 */

import { Info, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePanelStore } from '@/lib/panel-store'
import { PanelShell } from './panel-shell'
import type { ScriptFloraNode } from '@/lib/flow-types'

type Props = {
  selectedNode: ScriptFloraNode | null
}

/** Friendly label map for node types */
const NODE_TYPE_LABELS: Record<string, string> = {
  brief: 'Brief',
  skill: 'Skill Selector',
  content: 'Script Stage',
  continuity: 'Continuity Checker',
  output: 'Multi-Format Output',
  export: 'Export',
  'character-bible': 'Character Bible',
  'style-lock': 'World / Style Lock',
  'continuity-log': 'Continuity Log',
  'shot-list': 'Shot List',
  storyboard: 'Storyboard Frame',
  sequence: 'Sequence',
  'generate-shot': 'Generate Shot',
  result: 'Result',
  checkpoint: 'Checkpoint',
  timeline: 'Timeline',
  'export-package': 'Export Package',
  'batch-planner': 'Batch Planner',
  'autopilot-dashboard': 'Autopilot Dashboard',
  'episode-memory': 'Episode Memory',
  'series-arc': 'Series Arc',
  'project-pack': 'Project Pack',
  'social-variants': 'Social Variants',
  'team-workspace': 'Team Workspace',
  hyperframes: 'HyperFrames',
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-3 py-2 border-b border-white/[0.05] last:border-b-0">
      <p className="mb-0.5 text-[9.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60">{label}</p>
      <div className="text-[11.5px] text-foreground/80 break-words">{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    empty:      'text-muted-foreground/60 bg-white/[0.05]',
    draft:      'text-muted-foreground bg-white/[0.06]',
    generating: 'text-primary bg-primary/10',
    approved:   'text-success bg-success/10',
    error:      'text-destructive bg-destructive/10',
    locked:     'text-warning/80 bg-warning/10',
  }
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', colors[status] ?? 'text-muted-foreground bg-white/[0.05]')}>
      {status}
    </span>
  )
}

export function InspectorPanel({ selectedNode }: Props) {
  const { panels } = usePanelStore()
  const panel = panels['inspector']
  if (!panel?.visible) return null

  return (
    <PanelShell
      id="inspector"
      title="Inspector"
      icon={<Info className="size-3.5" />}
    >
      {!selectedNode ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
          <Layers className="size-8 text-muted-foreground/20" />
          <p className="text-[11.5px] text-muted-foreground/50">
            Select a node on the canvas to inspect its properties.
          </p>
        </div>
      ) : (
        <div>
          {/* Node type header */}
          <div className="border-b border-white/[0.06] px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-medium text-foreground/90">
                {NODE_TYPE_LABELS[selectedNode.type ?? ''] ?? selectedNode.type}
              </span>
              {'status' in selectedNode.data && (
                <StatusBadge status={String(selectedNode.data.status)} />
              )}
            </div>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/40">{selectedNode.id}</p>
          </div>

          {/* Origin / provenance */}
          {'origin' in selectedNode.data && selectedNode.data.origin && (
            <Field label="Origin" value={
              <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium',
                selectedNode.data.origin === 'skill' ? 'bg-primary/10 text-primary/80' : 'bg-white/[0.06] text-muted-foreground')}>
                {String(selectedNode.data.origin)}
              </span>
            } />
          )}

          {'provenance' in selectedNode.data && selectedNode.data.provenance && (() => {
            const p = selectedNode.data.provenance as Record<string, string>
            return (
              <>
                <Field label="Skill" value={`${p.skillId} v${p.skillVersion}`} />
                <Field label="Node key" value={<code className="font-mono text-[10.5px]">{p.skillNodeKey}</code>} />
              </>
            )
          })()}

          {/* Locked / approved */}
          {'locked' in selectedNode.data && (
            <Field label="Locked" value={selectedNode.data.locked ? '✓ Yes' : 'No'} />
          )}
          {'approved' in selectedNode.data && (
            <Field label="Approved" value={selectedNode.data.approved ? '✓ Yes' : 'No'} />
          )}

          {/* staleReason */}
          {'staleReason' in selectedNode.data && selectedNode.data.staleReason && (
            <Field label="Stale reason" value={
              <span className="text-warning/80">{String(selectedNode.data.staleReason)}</span>
            } />
          )}

          {/* Content node specifics */}
          {selectedNode.type === 'content' && 'kind' in selectedNode.data && (
            <>
              <Field label="Kind" value={<code className="font-mono text-[10.5px]">{String(selectedNode.data.kind)}</code>} />
              {'stageKey' in selectedNode.data && selectedNode.data.stageKey && (
                <Field label="Stage key" value={<code className="font-mono text-[10.5px]">{String(selectedNode.data.stageKey)}</code>} />
              )}
              {'tokens' in selectedNode.data && (
                <Field label="Tokens" value={`${Number(selectedNode.data.tokens ?? 0).toLocaleString()} tok`} />
              )}
            </>
          )}

          {/* Contract */}
          {'contract' in selectedNode.data && selectedNode.data.contract && (() => {
            const c = selectedNode.data.contract as { reads: string[]; writes: string[]; sideEffects: string }
            return (
              <Field label="Contract" value={
                <div className="space-y-0.5">
                  <p>reads: {c.reads.join(', ')}</p>
                  <p>writes: {c.writes.join(', ')}</p>
                  <p>sideEffects: {c.sideEffects}</p>
                </div>
              } />
            )
          })()}

          {/* Position */}
          <Field label="Position" value={
            `x: ${Math.round(selectedNode.position.x)}, y: ${Math.round(selectedNode.position.y)}`
          } />
        </div>
      )}
    </PanelShell>
  )
}
