'use client'

import { type NodeProps } from '@xyflow/react'
import { ArrowDownToLine, Check, Lock, LockOpen, Trash2, AlertCircle, Info } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { EXPORT_FORMAT_OPTIONS, type ExportFormatId, type ExportNode as ExportNodeType } from '@/lib/flow-types'
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
type ContentData = { label?: string; index?: number; content?: string; kind?: string }

const heading = (d: ContentData) =>
  d.index != null ? `${d.label} ${d.index}` : (d.label ?? 'Section')

/**
 * Build export text for each format.
 *
 * pdf / docx / fdx: browser can't render these properly, so we produce
 * the plain-text equivalent with a header note and let the user import
 * it into their preferred tool.
 * ponytail: ceiling — server-side PDF/DOCX/FDX generation is the upgrade path.
 */
function buildExport(format: ExportFormatId, nodes: CanvasNode[], includeNotes: boolean): string {
  const brief = nodes.find((n) => n.type === 'brief')
  const title = (brief?.data?.title as string) || 'Script'
  const contentNodes = nodes.filter(
    (n) => n.type === 'content' && ((n.data as ContentData).content ?? '').trim(),
  )

  if (format === 'fountain') {
    // Fountain screenplay plain-text format (https://fountain.io)
    const lines: string[] = [
      `Title: ${title}`,
      brief?.data?.author ? `Author: ${brief.data.author}` : '',
      '',
      '===',
      '',
    ].filter((l, i) => i < 3 || l !== '')

    for (const n of contentNodes) {
      const d = n.data as ContentData
      const kind = d.kind ?? ''
      const text = (d.content ?? '').trim()

      if (kind === 'hook' || kind === 'cta') {
        // Transition-like
        lines.push(`> ${heading(d).toUpperCase()} <`, '', text, '')
      } else if (kind === 'scene' || kind.includes('screenplay') || kind.includes('technical')) {
        // Scene heading + action
        lines.push(`INT./EXT. ${heading(d).toUpperCase()} - DAY`, '', text, '')
      } else if (kind === 'dialogue' || kind === 'auteur-stageplay') {
        // Try to detect speaker: "NAME: line" pattern
        const speakerMatch = text.match(/^([A-Z][A-Z\s]+):\s+(.+)/ms)
        if (speakerMatch) {
          lines.push(speakerMatch[1].trim(), speakerMatch[2].trim(), '')
        } else {
          lines.push('NARRATOR', text, '')
        }
      } else if (kind === 'visual' || kind === 'auteur-production-summary') {
        if (includeNotes) lines.push(`/* ${heading(d)} */`, '', text, '')
      } else {
        lines.push(`## ${heading(d)}`, '', text, '')
      }
    }
    return lines.join('\n')
  }

  if (format === 'fdx') {
    // Final Draft XML — browser-only approximation as tagged XML
    // ponytail: real FDX requires Final Draft-specific XML schema; this is
    // a best-effort plain import that Final Draft 11+ can open via File > Import.
    const escapeXml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    const paragraphs = contentNodes.map((n) => {
      const d = n.data as ContentData
      const kind = d.kind ?? ''
      const text = escapeXml((d.content ?? '').trim())
      const type =
        kind === 'scene' || kind.includes('screenplay') ? 'Scene Heading'
        : kind === 'dialogue' || kind.includes('stageplay') ? 'Dialogue'
        : kind === 'visual' ? 'Action'
        : kind === 'hook' || kind === 'cta' ? 'Transition'
        : 'Action'
      return `    <Paragraph Type="${type}">\n      <Text>${text}</Text>\n    </Paragraph>`
    }).join('\n')

    return `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<FinalDraft DocumentType="Script" Template="No" Version="2">
  <Content>
${paragraphs}
  </Content>
  <TitlePage>
    <Content>
      <Paragraph Alignment="Center"><Text>${escapeXml(title)}</Text></Paragraph>
    </Content>
  </TitlePage>
</FinalDraft>`
  }

  // pdf / docx → produce structured markdown with a notice
  // The user can paste into Word or use a Markdown→PDF converter
  const notice = format === 'pdf'
    ? '<!-- Export as PDF: open in a Markdown editor and print/export to PDF -->\n\n'
    : format === 'docx'
      ? '<!-- Export as DOCX: paste into Word or use Pandoc: pandoc script.md -o script.docx -->\n\n'
      : ''

  // md — clean screenplay-style markdown
  const lines: string[] = [notice + `# ${title}`, '']
  if (brief) {
    const b = brief.data
    if (b.objective) lines.push(`> **Objective:** ${b.objective}`, '')
    if (b.audience) lines.push(`> **Audience:** ${b.audience}`, '')
    if (b.duration) lines.push(`> **Duration:** ${b.duration}`, '')
    if (b.tone) lines.push(`> **Tone:** ${b.tone}`, '')
    lines.push('---', '')
  }

  for (const n of contentNodes) {
    const d = n.data as ContentData
    if (!includeNotes && (d.kind === 'visual' || d.kind === 'auteur-production-summary')) continue
    lines.push(`## ${heading(d)}`, '', (d.content ?? '').trim(), '')
  }

  return lines.join('\n')
}

/** Map format id to MIME type for the download blob */
const MIME: Record<ExportFormatId, string> = {
  md: 'text/markdown',
  fountain: 'text/plain',
  fdx: 'application/xml',
  pdf: 'text/markdown',   // ponytail: real PDF needs server; download as .md with notice
  docx: 'text/markdown',  // ponytail: real DOCX needs server; download as .md with notice
}

/** Formats that are handled server-side via /api/export */
const SERVER_EXPORT = new Set<ExportFormatId>(['pdf', 'docx'])

export function ExportNode({ id, data, selected }: NodeProps<ExportNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [justExported, setJustExported] = useState(false)
  const [warning, setWarning] = useState('')
  const [exporting, setExporting] = useState(false)
  const disabled = Boolean(data.locked)

  const active = EXPORT_FORMAT_OPTIONS.find((f) => f.id === data.format)

  const handleExport = async () => {
    const nodes = (
      (window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined
    ) ?? []

    const contentNodes = nodes.filter((n) => n.type === 'content')
    if (contentNodes.length === 0) {
      setWarning('No content nodes found. Generate script content first.')
      return
    }
    const hasContent = contentNodes.some(
      (n) => ((n.data as ContentData).content ?? '').trim().length > 0,
    )
    if (!hasContent) {
      setWarning('Content nodes are empty. Generate or write content before exporting.')
      return
    }

    setWarning('')
    const fmt = (data.format ?? 'md') as ExportFormatId

    // PDF / DOCX — delegate to /api/export for proper document generation
    if (SERVER_EXPORT.has(fmt)) {
      setExporting(true)
      const brief = nodes.find((n) => n.type === 'brief')
      const stages = contentNodes
        .filter((n) => ((n.data as ContentData).content ?? '').trim())
        .map((n) => {
          const d = n.data as ContentData
          return { label: d.label ?? '', index: d.index, content: d.content ?? '', kind: d.kind }
        })

      try {
        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            format: fmt,
            title: (brief?.data?.title as string) || 'Script',
            objective: brief?.data?.objective as string | undefined,
            audience: brief?.data?.audience as string | undefined,
            duration: brief?.data?.duration as string | undefined,
            tone: brief?.data?.tone as string | undefined,
            stages,
            filename: data.filename || 'script',
          }),
        })

        if (!res.ok) {
          setWarning('Export failed — try again.')
          return
        }

        if (fmt === 'pdf') {
          // Open styled HTML in new window — user prints/saves as PDF
          const html = await res.text()
          const win = window.open('', '_blank')
          if (win) {
            win.document.write(html)
            win.document.close()
          } else {
            setWarning('Pop-up blocked. Allow pop-ups for this site to export PDF.')
          }
        } else {
          // DOCX — trigger binary download
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${data.filename || 'script'}.docx`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }

        update(id, { status: 'approved' })
        setJustExported(true)
        window.setTimeout(() => setJustExported(false), 2000)
      } catch {
        setWarning('Export failed — check your connection and try again.')
      } finally {
        setExporting(false)
      }
      return
    }

    // Client-side formats (md, fountain, fdx)
    const text = buildExport(fmt, nodes, data.includeNotes ?? false)
    const ext = active?.ext ?? '.md'
    const mime = MIME[fmt] ?? 'text/markdown'
    const blob = new Blob([text], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.filename || 'script'}${ext}`
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
            {/* Notice for formats that need server-side rendering */}
            {SERVER_ONLY.has((data.format ?? 'md') as ExportFormatId) && (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-primary/20 bg-primary/8 px-2.5 py-2">
                <Info className="mt-0.5 size-3 shrink-0 text-primary/70" />
                <p className="text-[10px] leading-snug text-muted-foreground">
                  {data.format === 'pdf'
                    ? 'Downloads as Markdown. Open in Typora, Notion, or any editor and export to PDF.'
                    : 'Downloads as Markdown. Use Pandoc or paste into Word to convert: pandoc script.md -o script.docx'}
                </p>
              </div>
            )}
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
              <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                {SERVER_ONLY.has((data.format ?? 'md') as ExportFormatId) ? '.md' : active?.ext}
              </span>
            </div>
          </label>

          {/* Include visual/production notes toggle */}
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
            <span className="text-muted-foreground text-[11.5px]">Include visual / production notes</span>
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
          <span className="truncate font-mono text-[10px]">
            {data.filename}{SERVER_ONLY.has((data.format ?? 'md') as ExportFormatId) ? '.md' : active?.ext}
          </span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
