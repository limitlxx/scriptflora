'use client'

import { type NodeProps } from '@xyflow/react'
import { ArrowDownToLine, Check, Lock, LockOpen, Trash2, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { EXPORT_FORMAT_OPTIONS, type ExportNode as ExportNodeType } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel,
  NodeDivider,
  NodeFooter,
  NodeHeader,
  NodeShell,
  StatusDot,
  ToolbarButton,
  ToolbarDivider,
  fieldClass,
} from './node-shell'

type CanvasNode = { type?: string; data: Record<string, unknown> }

function buildMarkdown(nodes: CanvasNode[]): string {
  const brief = nodes.find((n) => n.type === 'brief')
  const title = (brief?.data?.title as string) || 'Script'
  const lines: string[] = [`# ${title}`, '']

  // Brief summary
  if (brief) {
    const d = brief.data
    if (d.objective) lines.push(`> **Objective:** ${d.objective}`, '')
    if (d.audience) lines.push(`> **Audience:** ${d.audience}`, '')
    if (d.duration) lines.push(`> **Duration:** ${d.duration}`, '')
  }

  // Content nodes in document order
  for (const node of nodes) {
    if (node.type !== 'content') continue
    const d = node.data as { label?: string; index?: number; content?: string; kind?: string }
    if (!d.content?.trim()) continue
    const heading = d.index != null ? `## ${d.label} ${d.index}` : `## ${d.label}`
    lines.push(heading, '', d.content.trim(), '')
  }

  return lines.join('\n')
}

export function ExportNode({ id, data, selected }: NodeProps<ExportNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [justExported, setJustExported] = useState(false)
  const [warning, setWarning] = useState('')
  const disabled = Boolean(data.locked)

  const active = EXPORT_FORMAT_OPTIONS.find((f) => f.id === data.format)

  const handleExport = () => {
    // Read from the canvas-exposed global (set by script-flow-canvas on every node change)
    const nodes = (
      (window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined
    ) ?? []

    const contentNodes = nodes.filter((n) => n.type === 'content')
    if (contentNodes.length === 0) {
      setWarning('No content nodes found. Generate script content first.')
      return
    }

    const hasContent = contentNodes.some(
      (n) => ((n.data as { content?: string }).content ?? '').trim().length > 0,
    )
    if (!hasContent) {
      setWarning('Content nodes are empty. Generate or write content before exporting.')
      return
    }

    setWarning('')
    const text = buildMarkdown(nodes)
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.filename || 'script'}${active?.ext ?? '.md'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    update(id, { status: 'approved' })
    setJustExported(true)
    window.setTimeout(() => setJustExported(false), 2000)
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={310}
        hasSource={false}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
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
          icon={ArrowDownToLine}
          title="Export"
          subtitle="Deliver the script"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3 px-4 py-3.5">
          {/* Format picker */}
          <div>
            <FieldLabel>Format</FieldLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {EXPORT_FORMAT_OPTIONS.map((format) => {
                const isActive = data.format === format.id
                return (
                  <button
                    key={format.id}
                    type="button"
                    disabled={disabled}
                    aria-pressed={isActive}
                    onClick={() => { update(id, { format: format.id }); setWarning('') }}
                    className={cn(
                      'nodrag rounded-md border px-1.5 py-1.5 text-[10.5px] leading-tight transition-all duration-150',
                      'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
                      isActive
                        ? 'border-primary/45 bg-accent-muted text-primary'
                        : 'text-muted-foreground hover:text-foreground border-white/[0.08] bg-black/20 hover:border-white/[0.15]',
                    )}
                  >
                    {format.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Filename */}
          <label className="block">
            <FieldLabel>Filename</FieldLabel>
            <div className="flex items-center gap-1.5">
              <input
                value={data.filename}
                disabled={disabled}
                onChange={(e) => update(id, { filename: e.target.value })}
                className={fieldClass}
              />
              <span className="text-muted-foreground shrink-0 font-mono text-[11px]">{active?.ext}</span>
            </div>
          </label>

          {/* Include notes toggle */}
          <button
            type="button"
            disabled={disabled}
            aria-pressed={data.includeNotes}
            onClick={() => update(id, { includeNotes: !data.includeNotes })}
            className={cn(
              'nodrag flex w-full items-center gap-2 rounded-lg px-0.5 py-1 text-left',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
            )}
          >
            <span className={cn(
              'flex size-3.5 items-center justify-center rounded border transition-all duration-150',
              data.includeNotes ? 'border-primary bg-primary' : 'border-white/20',
            )}>
              {data.includeNotes && <Check className="text-primary-foreground size-2.5" />}
            </span>
            <span className="text-muted-foreground text-[11.5px]">Include production notes</span>
          </button>

          {/* Warning */}
          {warning && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-2.5 py-2">
              <AlertCircle className="mt-0.5 size-3 shrink-0 text-warning" />
              <p className="text-[10.5px] leading-snug text-warning/90">{warning}</p>
            </div>
          )}

          {/* Export button */}
          <button
            type="button"
            disabled={disabled}
            onClick={handleExport}
            className={cn(
              'nodrag flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2',
              'text-[12px] font-medium transition-all duration-200',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
              justExported
                ? 'bg-success/15 text-success'
                : 'bg-primary text-primary-foreground hover:opacity-90',
            )}
          >
            {justExported
              ? <><Check className="size-3.5" />Exported!</>
              : <><ArrowDownToLine className="size-3.5" />Export script</>
            }
          </button>
        </div>

        <NodeDivider />
        <NodeFooter>
          <span className="truncate font-mono text-[10px]">{data.filename}{active?.ext}</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
