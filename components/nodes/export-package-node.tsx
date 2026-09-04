'use client'

import { type NodeProps } from '@xyflow/react'
import {
  ArrowDownToLine, Check, Lock, LockOpen, Package, Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ExportPackageNode as ExportPackageNodeType, NLETarget } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'

const NLE_OPTIONS: { id: NLETarget; label: string; ext: string }[] = [
  { id: 'capcut',   label: 'CapCut',     ext: 'txt' },
  { id: 'premiere', label: 'Premiere',   ext: 'csv' },
  { id: 'davinci',  label: 'DaVinci',    ext: 'edl' },
  { id: 'descript', label: 'Descript',   ext: 'txt' },
  { id: 'generic',  label: 'Generic',    ext: 'txt' },
]

// Build NLE marker file content from clip data
function buildNleMarkers(
  clips: Array<{ label: string; durationSeconds: number; transition: string }>,
  target: NLETarget,
): string {
  let offset = 0
  const rows = clips.map((c, i) => {
    const start = offset
    offset += c.durationSeconds
    return { index: i + 1, label: c.label, start, end: offset, transition: c.transition }
  })

  if (target === 'davinci') {
    // Basic EDL format
    const lines = ['TITLE: ScriptFlora Export', 'FCM: NON-DROP FRAME', '']
    rows.forEach((r) => {
      const tcIn  = toTimecode(r.start)
      const tcOut = toTimecode(r.end)
      lines.push(`${String(r.index).padStart(3, '0')}  AX       V     C        ${tcIn} ${tcOut} ${tcIn} ${tcOut}`)
      lines.push(`* FROM CLIP NAME: ${r.label}`)
      lines.push('')
    })
    return lines.join('\n')
  }

  if (target === 'premiere') {
    const header = 'Shot,Label,In (sec),Out (sec),Transition'
    const body = rows.map((r) => `${r.index},"${r.label}",${r.start},${r.end},${r.transition}`).join('\n')
    return `${header}\n${body}`
  }

  // Generic / CapCut / Descript — simple marker list
  return rows.map((r) => `[${toTimecode(r.start)}] ${r.label} → ${toTimecode(r.end)} (${r.transition})`).join('\n')
}

function toTimecode(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const f = Math.floor((sec % 1) * 25) // 25fps
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`
}
function pad(n: number) { return n.toString().padStart(2, '0') }

export function ExportPackageNode({ id, data, selected }: NodeProps<ExportPackageNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [done, setDone] = useState(false)
  const disabled = Boolean(data.locked)

  const toggle = (key: keyof typeof data) =>
    update(id, { [key]: !data[key] })

  const nle = NLE_OPTIONS.find((n) => n.id === data.nleTarget) ?? NLE_OPTIONS[4]

  const handleExport = async () => {
    setExporting(true)
    setDone(false)

    type CanvasNode = { id: string; type?: string; data: Record<string, unknown> }
    const allNodes = ((window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined) ?? []

    const brief     = allNodes.find((n) => n.type === 'brief')
    const timeline  = allNodes.find((n) => n.type === 'timeline')
    const bible     = allNodes.find((n) => n.type === 'character-bible')
    const styleLock = allNodes.find((n) => n.type === 'style-lock')
    const contLog   = allNodes.find((n) => n.type === 'continuity-log')
    const shotLists = allNodes.filter((n) => n.type === 'shot-list')
    const contents  = allNodes.filter((n) => n.type === 'content')

    const title = (brief?.data?.title as string | undefined) ?? 'ScriptFlora Export'
    const slug  = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const filename = data.filename || slug

    // ── Collect clips ───────────────────────────────────────────────
    type Clip = { label: string; durationSeconds: number; videoUrl?: string; audioUrl?: string; transition: string }
    const clips: Clip[] = ((timeline?.data?.clips as Clip[] | undefined) ?? [])

    const files: { name: string; content: string; mimeType: string }[] = []

    // ── 1. Numbered clip manifest (clips are blobs — we write a manifest) ──
    if (clips.length > 0) {
      const manifest = clips.map((c, i) => ({
        number: i + 1,
        label: c.label,
        duration: c.durationSeconds,
        transition: c.transition,
        hasVideo: Boolean(c.videoUrl),
        hasAudio: Boolean(c.audioUrl),
      }))
      files.push({
        name: 'clips/CLIP_MANIFEST.json',
        content: JSON.stringify(manifest, null, 2),
        mimeType: 'application/json',
      })
    }

    // ── 2. Script ────────────────────────────────────────────────────
    if (data.includeScript) {
      const scriptLines: string[] = [`# ${title}`, '']
      if (brief) {
        const b = brief.data
        if (b.objective) scriptLines.push(`> **Objective:** ${b.objective}`, '')
        if (b.audience)  scriptLines.push(`> **Audience:** ${b.audience}`, '')
      }
      contents.forEach((n) => {
        const d = n.data as { label?: string; index?: number; content?: string }
        if (!d.content?.trim()) return
        const h = d.index != null ? `## ${d.label} ${d.index}` : `## ${d.label}`
        scriptLines.push(h, '', d.content.trim(), '')
      })
      files.push({ name: 'script.md', content: scriptLines.join('\n'), mimeType: 'text/markdown' })
    }

    // ── 3. Shot list ─────────────────────────────────────────────────
    if (shotLists.length > 0) {
      const rows = ['# Shot List', '']
      shotLists.forEach((n) => {
        const shots = (n.data.shots ?? []) as Array<{ index: number; label: string; camera: string; action: string; durationTarget: string; status: string }>
        shots.forEach((s) => {
          rows.push(`## Shot ${s.index} — ${s.label}`)
          rows.push(`- Camera: ${s.camera}`)
          rows.push(`- Action: ${s.action}`)
          rows.push(`- Duration: ${s.durationTarget}`)
          rows.push(`- Status: ${s.status}`)
          rows.push('')
        })
      })
      files.push({ name: 'shot-list.md', content: rows.join('\n'), mimeType: 'text/markdown' })
    }

    // ── 4. Character Bible ───────────────────────────────────────────
    if (data.includeCharacterBible && bible) {
      const chars = (bible.data.characters ?? []) as Array<{
        name: string; role: string; goals: string; traits: string
        visualDescription: string; wardrobe: string; status: string
        voiceProfile: { voiceId: string; tone: string; style: string }
      }>
      const lines = ['# Character Bible', '']
      chars.forEach((c) => {
        lines.push(`## ${c.name} (${c.role}) [${c.status}]`)
        lines.push(`**Goals:** ${c.goals}`)
        lines.push(`**Traits:** ${c.traits}`)
        lines.push(`**Visual:** ${c.visualDescription}`)
        lines.push(`**Wardrobe:** ${c.wardrobe}`)
        lines.push(`**Voice:** ${c.voiceProfile.tone}, ${c.voiceProfile.style} (ID: ${c.voiceProfile.voiceId})`)
        lines.push('')
      })
      if (styleLock) {
        const sl = styleLock.data as { medium?: string; visualRules?: string; locations?: string; hardConstraints?: string }
        lines.push('## Style Lock')
        lines.push(`**Medium:** ${sl.medium}`)
        lines.push(`**Visual rules:** ${sl.visualRules}`)
        lines.push(`**Locations:** ${sl.locations}`)
        lines.push(`**NEVER change:** ${sl.hardConstraints}`)
      }
      files.push({ name: 'character-bible.md', content: lines.join('\n'), mimeType: 'text/markdown' })
    }

    // ── 5. Continuity Log ────────────────────────────────────────────
    if (data.includeContinuityLog && contLog) {
      const entries = (contLog.data.entries ?? []) as Array<{
        sceneLabel: string; characterStates: string; revealedFacts: string
        openThreads: string; wardrobeChanges: string
      }>
      const lines = ['# Continuity Log', '']
      entries.forEach((e) => {
        lines.push(`## ${e.sceneLabel}`)
        if (e.characterStates)  lines.push(`**Character states:** ${e.characterStates}`)
        if (e.revealedFacts)    lines.push(`**Revealed facts:** ${e.revealedFacts}`)
        if (e.openThreads)      lines.push(`**Open threads:** ${e.openThreads}`)
        if (e.wardrobeChanges)  lines.push(`**Wardrobe changes:** ${e.wardrobeChanges}`)
        lines.push('')
      })
      files.push({ name: 'continuity-log.md', content: lines.join('\n'), mimeType: 'text/markdown' })
    }

    // ── 6. NLE markers ───────────────────────────────────────────────
    if (data.includeNleMarkers && clips.length > 0) {
      const markers = buildNleMarkers(clips, data.nleTarget)
      files.push({ name: `nle-markers.${nle.ext}`, content: markers, mimeType: 'text/plain' })
    }

    // ── 7. README ────────────────────────────────────────────────────
    files.push({
      name: 'README.txt',
      content: [
        `ScriptFlora Export Package`,
        `Project: ${title}`,
        `Exported: ${new Date().toLocaleString()}`,
        `NLE target: ${nle.label}`,
        '',
        'Files included:',
        ...files.map((f) => `  - ${f.name}`),
        '',
        'Import clips in the order shown in CLIP_MANIFEST.json.',
        'Use nle-markers file to place cut points in your editor.',
      ].join('\n'),
      mimeType: 'text/plain',
    })

    // ── Download each file individually (no zip dependency) ──────────
    // ponytail: zip would need a dependency; individual downloads work in all
    // editors and are trivially re-organized. Ceiling: >20 clips may be tedious.
    // Upgrade path: add JSZip when zip is explicitly requested.
    for (const file of files) {
      const blob = new Blob([file.content], { type: file.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}-${file.name.replace(/\//g, '-')}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      // Small delay between downloads so browsers don't block them
      await new Promise((r) => window.setTimeout(r, 80))
    }

    update(id, { status: 'approved', lastExportedAt: new Date().toISOString() })
    setDone(true)
    setExporting(false)
    window.setTimeout(() => setDone(false), 3000)
  }

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
          icon={Package}
          title="Export Package"
          subtitle="Handoff to professional editor"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3.5 px-4 py-3.5">
          {/* Filename */}
          <label className="block">
            <FieldLabel>Package name</FieldLabel>
            <input
              value={data.filename}
              disabled={disabled}
              onChange={(e) => update(id, { filename: e.target.value })}
              placeholder="my-film-v1"
              className={fieldClass}
            />
          </label>

          {/* NLE target */}
          <div>
            <FieldLabel>NLE target</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {NLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  aria-pressed={data.nleTarget === opt.id}
                  onClick={() => update(id, { nleTarget: opt.id })}
                  className={cn(
                    'nodrag rounded-lg border px-2.5 py-1 text-[11px] transition-all',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
                    data.nleTarget === opt.id
                      ? 'border-primary/45 bg-accent-muted text-primary'
                      : 'border-white/[0.08] bg-black/20 text-muted-foreground hover:border-white/[0.15] hover:text-foreground',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Include toggles */}
          <div className="space-y-2">
            {(
              [
                ['includeScript',         'Script (Markdown)'],
                ['includeCharacterBible', 'Character Bible + Style Lock'],
                ['includeContinuityLog',  'Continuity Log'],
                ['includeNleMarkers',     `NLE markers (.${nle.ext})`],
              ] as [keyof typeof data, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                disabled={disabled}
                aria-pressed={Boolean(data[key])}
                onClick={() => toggle(key)}
                className="nodrag flex w-full items-center gap-2 text-left focus-visible:outline-none disabled:pointer-events-none"
              >
                <span className={cn(
                  'flex size-3.5 items-center justify-center rounded border transition-all',
                  data[key] ? 'border-primary bg-primary' : 'border-white/20',
                )}>
                  {data[key] && <Check className="size-2.5 text-primary-foreground" />}
                </span>
                <span className="text-[11.5px] text-muted-foreground">{label}</span>
              </button>
            ))}
          </div>

          {/* Export button */}
          <button
            type="button"
            disabled={disabled || exporting}
            onClick={() => void handleExport()}
            className={cn(
              'nodrag flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-medium transition-all',
              'disabled:pointer-events-none disabled:opacity-50',
              done
                ? 'bg-success/15 text-success border border-success/25'
                : 'bg-primary text-primary-foreground hover:opacity-90',
            )}
          >
            {done
              ? <><Check className="size-4" />Package exported!</>
              : exporting
              ? <><span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />Building…</>
              : <><ArrowDownToLine className="size-4" />Export package</>
            }
          </button>

          {data.lastExportedAt && (
            <p className="text-center text-[10px] text-muted-foreground/60">
              Last exported: {new Date(data.lastExportedAt).toLocaleString()}
            </p>
          )}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>For {nle.label}</span>
          <span className="font-mono text-[10px]">{data.filename || 'untitled'}</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
