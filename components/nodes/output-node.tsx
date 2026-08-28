'use client'

import { type NodeProps } from '@xyflow/react'
import { ArrowDownToLine, LayoutGrid, Lock, LockOpen, PlayCircle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { OutputNode as OutputNodeType } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  NodeDivider, NodeFooter, NodeHeader, NodeShell,
  StatusDot, ToolbarButton, ToolbarDivider,
} from './node-shell'

type CanvasNode = { type?: string; data: Record<string, unknown> }

/**
 * Collects all enabled format variants from the canvas and triggers a download.
 * Each enabled format gets its own file.
 */
function downloadFormat(formatId: string, nodes: CanvasNode[], filename: string) {
  const brief = nodes.find((n) => n.type === 'brief')
  const title = (brief?.data?.title as string) || 'Script'
  // All content nodes with any text, preserving canvas order
  const contentNodes = nodes.filter(
    (n) => n.type === 'content' && ((n.data as { content?: string }).content ?? '').trim(),
  )

  type D = { label?: string; index?: number; content?: string; kind?: string }
  const heading = (d: D) =>
    d.index != null ? `${d.label} ${d.index}` : (d.label ?? 'Section')

  let text = ''

  if (formatId === 'beatsheet') {
    text = `# Beat Sheet — ${title}\n\n`
    for (const n of contentNodes) {
      const d = n.data as D
      const first = (d.content ?? '').split('\n')[0].trim().slice(0, 120)
      text += `- **${heading(d)}**: ${first}\n`
    }
    if (!text.trim().endsWith('\n\n')) text += '\n'

  } else if (formatId === 'shotlist') {
    // Include visual/scene kinds first, then everything else as fallback
    const visual = contentNodes.filter((n) => {
      const k = (n.data as D).kind ?? ''
      return k === 'visual' || k === 'scene' || k.includes('technical') || k.includes('screenplay')
    })
    const rows = visual.length > 0 ? visual : contentNodes
    text = `# Shot List — ${title}\n\n| # | Stage | Description |\n|---|-------|-------------|\n`
    rows.forEach((n, i) => {
      const d = n.data as D
      const first = (d.content ?? '').split('\n')[0].trim().slice(0, 100)
      text += `| ${i + 1} | ${heading(d)} | ${first} |\n`
    })

  } else if (formatId === 'voiceover') {
    // Dialogue/hook/CTA first, fall back to all content
    const spoken = contentNodes.filter((n) => {
      const k = (n.data as D).kind ?? ''
      return k === 'dialogue' || k === 'hook' || k === 'cta' || k === 'auteur-stageplay'
    })
    const rows = spoken.length > 0 ? spoken : contentNodes
    text = `# Voiceover Script — ${title}\n\n`
    for (const n of rows) {
      const d = n.data as D
      text += `### ${heading(d)}\n\n${(d.content ?? '').trim()}\n\n`
    }

  } else if (formatId === 'social') {
    const hook = contentNodes.find((n) => (n.data as D).kind === 'hook')
    const cta = contentNodes.find((n) => (n.data as D).kind === 'cta')
    // Auteur fallback: stageplay as hook equivalent
    const opener = hook ?? contentNodes.find((n) => (n.data as D).kind === 'auteur-stageplay') ?? contentNodes[0]
    const closer = cta ?? contentNodes[contentNodes.length - 1]

    text = `# Social Cutdown — ${title}\n\n`
    if (opener) {
      const d = opener.data as D
      // Take first 3 lines only for social brevity
      const condensed = (d.content ?? '').split('\n').slice(0, 3).join('\n').trim()
      text += `**HOOK**\n${condensed}\n\n`
    }
    if (closer && closer !== opener) {
      const d = closer.data as D
      text += `**CLOSE**\n${(d.content ?? '').split('\n').slice(0, 2).join('\n').trim()}\n\n`
    }
    text += `---\n*Condense to 15–30s for delivery. Full script in screenplay format.*\n`

  } else {
    // screenplay (default) — full script
    text = `# ${title}\n\n`
    if (brief) {
      const b = brief.data
      if (b.objective) text += `> ${b.objective}\n\n`
    }
    for (const n of contentNodes) {
      const d = n.data as D
      text += `## ${heading(d)}\n\n${(d.content ?? '').trim()}\n\n`
    }
  }

  const blob = new Blob([text.trim() + '\n'], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename || 'script'}-${formatId}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function OutputNode({ id, data, selected }: NodeProps<OutputNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [running, setRunning] = useState(false)
  const disabled = Boolean(data.locked)
  const enabledCount = data.formats.filter((f) => f.enabled).length

  const toggle = (formatId: string) => {
    update(id, { formats: data.formats.map((f) => f.id === formatId ? { ...f, enabled: !f.enabled } : f) })
  }

  const handleGenerate = () => {
    const nodes = (
      (window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined
    ) ?? []

    const contentNodes = nodes.filter(
      (n) => n.type === 'content' && ((n.data as { content?: string }).content ?? '').trim(),
    )
    if (contentNodes.length === 0) return

    setRunning(true)
    update(id, { status: 'generating' })

    // Simulate brief processing delay then trigger downloads for enabled formats
    window.setTimeout(() => {
      const brief = nodes.find((n) => n.type === 'brief')
      const filename = (brief?.data?.title as string | undefined)?.toLowerCase().replace(/\s+/g, '-') || 'script'
      const enabled = data.formats.filter((f) => f.enabled)
      for (const fmt of enabled) {
        downloadFormat(fmt.id, nodes, filename)
      }
      update(id, { status: 'approved' })
      setRunning(false)
    }, 600)
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={332}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton
              icon={PlayCircle}
              label="Generate formats"
              onClick={handleGenerate}
              disabled={disabled || running || enabledCount === 0}
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
          title="Multi-Format Output"
          subtitle="Select formats, then generate"
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
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none hover:bg-white/[0.04] disabled:pointer-events-none',
              )}
            >
              <span className={cn('relative h-3.5 w-6 shrink-0 rounded-full transition-colors duration-200', format.enabled ? 'bg-primary' : 'bg-white/[0.12]')}>
                <span className={cn('absolute top-0.5 size-2.5 rounded-full bg-white transition-all duration-200 ease-out', format.enabled ? 'left-[13px]' : 'left-0.5')} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block text-[12px] leading-tight font-medium transition-colors duration-150', format.enabled ? 'text-foreground' : 'text-muted-foreground')}>
                  {format.label}
                </span>
                <span className="text-muted-foreground/70 mt-0.5 block text-[10.5px] leading-tight">{format.description}</span>
              </span>
            </button>
          ))}
        </div>

        {enabledCount > 0 && (
          <>
            <NodeDivider />
            <div className="px-3 pb-3 pt-2">
              <button
                type="button"
                disabled={disabled || running}
                onClick={handleGenerate}
                className={cn(
                  'nodrag flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11.5px] font-medium',
                  'transition-colors disabled:pointer-events-none disabled:opacity-50',
                  running
                    ? 'bg-primary/10 text-primary'
                    : 'bg-primary/15 text-primary hover:bg-primary/25',
                )}
              >
                {running ? (
                  <><span className="size-3 animate-spin rounded-full border border-primary/40 border-t-primary" />Generating…</>
                ) : (
                  <><ArrowDownToLine className="size-3.5" />Download {enabledCount} format{enabledCount > 1 ? 's' : ''}</>
                )}
              </button>
            </div>
          </>
        )}

        <NodeDivider />
        <NodeFooter>
          <span>{enabledCount} of {data.formats.length} enabled</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
