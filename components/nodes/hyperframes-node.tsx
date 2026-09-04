'use client'

import { type NodeProps } from '@xyflow/react'
import {
  AlertCircle, Check, ChevronDown, Film,
  Info, Loader2, Lock, LockOpen, Play, RefreshCw, Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type {
  HyperFramesNode as HyperFramesNodeType,
  HyperFramesTemplate,
  HyperFramesClipMapping,
} from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'
import type {
  HyperFramesRenderResponse,
} from '@/app/api/hyperframes/render/route'
import type { HyperFramesStatusResponse } from '@/app/api/hyperframes/status/route'

const TEMPLATES: { id: HyperFramesTemplate; label: string; hint: string; ratios: string[] }[] = [
  { id: 'explainer_16x9',  label: 'Explainer 16:9',    hint: 'Narrated explainer with titles + lower thirds', ratios: ['16:9'] },
  { id: 'ad_endcard_16x9', label: 'Ad + End card',     hint: 'Short ad with branded end card and CTA',        ratios: ['16:9'] },
  { id: 'social_9x16',     label: 'Social 9:16',       hint: 'Vertical social with safe margins + captions',  ratios: ['9:16'] },
  { id: 'training_module', label: 'Training module',   hint: 'Lesson segment with section titles + key facts', ratios: ['16:9', '4:3'] },
]

const HF_STATUS_LABEL: Record<string, string> = {
  idle:                  'Idle',
  mapping:               'Mapping clips…',
  building_composition:  'Building composition…',
  rendering:             'Rendering…',
  ready_for_review:      'Ready for review',
  approved:              'Approved',
  failed:                'Failed',
}

const SUGGESTED_VARIABLES = [
  ['title',        'Project / episode title'],
  ['subtitle',     'Optional subtitle or episode label'],
  ['cta',          'Call-to-action text'],
  ['logoUrl',      'Brand logo URL or asset ID'],
  ['primaryColor', 'Brand colour hex (e.g. #1A2B3C)'],
  ['presenter',    'Presenter name (training template)'],
]

export function HyperFramesNode({ id, data, selected }: NodeProps<HyperFramesNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [showVars, setShowVars] = useState(false)
  const [showProvenance, setShowProvenance] = useState(false)
  const [newVarKey, setNewVarKey] = useState('')
  const [newVarVal, setNewVarVal] = useState('')
  const pollRef = useRef<number | null>(null)
  const disabled = Boolean(data.locked)

  const template = TEMPLATES.find((t) => t.id === data.templateId) ?? TEMPLATES[0]

  // ── Sync clips from approved Timeline node on canvas ──────────────
  const syncClips = () => {
    type CanvasNode = { id: string; type?: string; data: Record<string, unknown> }
    const allNodes = ((window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined) ?? []
    const timeline = allNodes.find((n) => n.type === 'timeline')
    if (!timeline) return

    type Clip = { id: string; label: string; videoUrl?: string; audioUrl?: string; durationSeconds: number; resultNodeId: string }
    const clips: Clip[] = (timeline.data.clips as Clip[] | undefined) ?? []
    const mappings: HyperFramesClipMapping[] = clips.map((c, i) => ({
      slotIndex: i,
      clipLabel: c.label,
      resultNodeId: c.resultNodeId ?? c.id,
      videoUrl: c.videoUrl,
      audioUrl: c.audioUrl,
      durationSeconds: c.durationSeconds,
    }))
    update(id, { clipMappings: mappings, hfStatus: 'mapping' })
  }

  // ── Render ────────────────────────────────────────────────────────
  const handleRender = async () => {
    if (!data.clipMappings.length) {
      update(id, { hfStatus: 'failed', errorMessage: 'No clips mapped. Sync from Timeline first.' })
      return
    }
    update(id, { hfStatus: 'building_composition', status: 'generating', errorMessage: undefined })

    try {
      const res = await fetch('/api/hyperframes/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: data.templateId,
          aspectRatios: template.ratios,
          variables: data.variables ?? {},
          clipMappings: data.clipMappings,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        update(id, { hfStatus: 'failed', status: 'error', errorMessage: body.error ?? 'Render failed.' })
        return
      }

      const result = await res.json() as HyperFramesRenderResponse
      update(id, {
        renderTaskId: result.taskId,
        provenance: result.provenance,
        hfStatus: 'rendering',
        status: 'generating',
      })

      // Start polling
      startPolling(result.taskId)
    } catch (err) {
      update(id, { hfStatus: 'failed', status: 'error', errorMessage: err instanceof Error ? err.message : 'Render failed.' })
    }
  }

  const startPolling = (taskId: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current)
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/hyperframes/status?taskId=${taskId}`)
        if (!res.ok) return
        const status = await res.json() as HyperFramesStatusResponse
        if (status.status === 'SUCCEEDED') {
          window.clearInterval(pollRef.current!)
          update(id, {
            hfStatus: 'ready_for_review',
            status: 'draft',
            provenance: data.provenance
              ? { ...data.provenance, outputAssets: status.outputAssets ?? [] }
              : undefined,
          })
        } else if (status.status === 'FAILED') {
          window.clearInterval(pollRef.current!)
          update(id, { hfStatus: 'failed', status: 'error', errorMessage: status.errorMessage ?? 'Render failed.' })
        }
      } catch { /* keep polling */ }
    }, 3000)
  }

  // Resume polling if task is in-progress after page reload
  useEffect(() => {
    if (data.hfStatus === 'rendering' && data.renderTaskId) {
      startPolling(data.renderTaskId)
    }
    return () => { if (pollRef.current) window.clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setVariable = (key: string, value: string) =>
    update(id, { variables: { ...(data.variables ?? {}), [key]: value } })

  const addVariable = () => {
    if (!newVarKey.trim()) return
    setVariable(newVarKey.trim(), newVarVal.trim())
    setNewVarKey('')
    setNewVarVal('')
  }

  const approve = () => update(id, { hfStatus: 'approved', status: 'approved' })

  const isRendering = data.hfStatus === 'rendering' || data.hfStatus === 'building_composition' || data.hfStatus === 'mapping'
  const outputs = data.provenance?.outputAssets ?? []

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={400}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton icon={RefreshCw} label="Sync clips from Timeline" onClick={syncClips} disabled={disabled || isRendering} tone="accent" />
            <ToolbarButton icon={Play} label="Render" onClick={() => void handleRender()} disabled={disabled || isRendering} />
            <ToolbarDivider />
            <ToolbarButton icon={data.locked ? LockOpen : Lock} label={data.locked ? 'Unlock' : 'Lock'}
              active={data.locked} onClick={() => act(id, data.locked ? 'unlock' : 'lock')} />
            <ToolbarDivider />
            <ToolbarButton icon={Trash2} label="Delete node" tone="danger" onClick={() => act(id, 'delete')} />
          </>
        }
      >
        <NodeHeader
          icon={Film}
          title="HyperFrames"
          subtitle="Composition & packaging"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3.5 px-4 py-3.5">
          {/* Status banner */}
          <div className={cn(
            'flex items-center justify-between rounded-xl border px-3 py-2.5',
            data.hfStatus === 'approved'      ? 'border-success/25 bg-success/8' :
            data.hfStatus === 'ready_for_review' ? 'border-primary/25 bg-primary/8' :
            data.hfStatus === 'failed'        ? 'border-destructive/25 bg-destructive/8' :
            isRendering                       ? 'border-primary/25 bg-primary/8' :
                                                'border-white/[0.07] bg-black/20',
          )}>
            <span className={cn('text-[12px] font-medium',
              data.hfStatus === 'approved'         ? 'text-success' :
              data.hfStatus === 'ready_for_review' ? 'text-primary' :
              data.hfStatus === 'failed'           ? 'text-destructive' :
              isRendering                          ? 'text-primary' :
                                                     'text-muted-foreground',
            )}>
              {isRendering && <span className="mr-1.5 inline-block size-1.5 animate-ping rounded-full bg-primary align-middle" />}
              {HF_STATUS_LABEL[data.hfStatus] ?? 'Idle'}
            </span>
            {data.hfStatus === 'rendering' && <Loader2 className="size-3.5 animate-spin text-primary" />}
          </div>

          {/* Template picker */}
          <div>
            <FieldLabel>Template</FieldLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {TEMPLATES.map((t) => (
                <button key={t.id} type="button" disabled={disabled || isRendering}
                  aria-pressed={data.templateId === t.id}
                  onClick={() => update(id, { templateId: t.id })}
                  title={t.hint}
                  className={cn(
                    'nodrag rounded-xl border p-2.5 text-left transition-all',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
                    data.templateId === t.id
                      ? 'border-primary/45 bg-accent-muted'
                      : 'border-white/[0.07] bg-black/20 hover:border-white/[0.14]',
                  )}>
                  <p className={cn('text-[11.5px] font-medium', data.templateId === t.id ? 'text-foreground' : 'text-foreground/80')}>{t.label}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60 leading-snug">{t.hint}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Clip mappings */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <FieldLabel>Clip mappings</FieldLabel>
              <button type="button" onClick={syncClips} disabled={disabled || isRendering}
                className="text-[10px] text-primary hover:underline disabled:opacity-40">
                Sync from Timeline
              </button>
            </div>
            {data.clipMappings.length === 0 ? (
              <p className="text-center text-[10.5px] text-muted-foreground/60 py-2">
                No clips mapped. Sync from the Timeline node.
              </p>
            ) : (
              <div className="space-y-1">
                {data.clipMappings.map((clip) => (
                  <div key={clip.slotIndex} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-white/[0.06] font-mono text-[10px] text-muted-foreground/60">
                      {clip.slotIndex + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-foreground/80">{clip.clipLabel}</span>
                    {clip.videoUrl && <Check className="size-3 shrink-0 text-success/60" title="Has video" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variables */}
          <div>
            <button type="button" onClick={() => setShowVars((v) => !v)}
              className="flex w-full items-center justify-between text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground">
              Variables
              <ChevronDown className={cn('size-3 transition-transform', showVars && 'rotate-180')} />
            </button>
            {showVars && (
              <div className="mt-2 space-y-2">
                {/* Suggested variables */}
                {SUGGESTED_VARIABLES.map(([key, hint]) => (
                  <label key={key} className="block">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground/70">{key}</span>
                      <span className="text-[9.5px] text-muted-foreground/50">{hint}</span>
                    </div>
                    <input value={(data.variables ?? {})[key] ?? ''} disabled={disabled}
                      onChange={(e) => setVariable(key, e.target.value)}
                      placeholder={`Enter ${key}…`} className={fieldClass} />
                  </label>
                ))}
                {/* Custom variable */}
                <div className="flex gap-1.5 pt-1">
                  <input value={newVarKey} onChange={(e) => setNewVarKey(e.target.value)}
                    placeholder="key" className={cn(fieldClass, 'w-28 font-mono text-[10.5px]')} />
                  <input value={newVarVal} onChange={(e) => setNewVarVal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addVariable()}
                    placeholder="value" className={cn(fieldClass, 'flex-1 text-[11px]')} />
                  <button type="button" onClick={addVariable} disabled={!newVarKey.trim()}
                    className="rounded-lg border border-white/[0.08] px-2 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40">
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {data.errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-2">
              <AlertCircle className="mt-0.5 size-3 shrink-0 text-destructive" />
              <p className="text-[10.5px] text-destructive/90">{data.errorMessage}</p>
            </div>
          )}

          {/* Render / re-render */}
          <button type="button" onClick={() => void handleRender()} disabled={disabled || isRendering}
            className={cn(
              'nodrag flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-medium transition-all',
              'disabled:pointer-events-none disabled:opacity-50',
              isRendering ? 'bg-primary/15 text-primary' : 'bg-primary text-primary-foreground hover:opacity-90',
            )}>
            {isRendering
              ? <><Loader2 className="size-4 animate-spin" />Rendering…</>
              : <><Play className="size-4" />{data.hfStatus === 'ready_for_review' || data.hfStatus === 'approved' ? 'Re-render' : 'Render'}</>
            }
          </button>

          {/* Output preview */}
          {outputs.length > 0 && (
            <div className="space-y-2">
              {outputs.map((asset) => (
                <div key={asset.ratio} className="rounded-xl border border-white/[0.07] bg-black/20 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1.5">
                    <span className="font-mono text-[10px] text-muted-foreground">{asset.ratio}</span>
                    {asset.url && (
                      <a href={asset.url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline">
                        Download
                      </a>
                    )}
                  </div>
                  {asset.url ? (
                    <video src={asset.url} controls className="aspect-video w-full bg-black" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center text-[10.5px] text-muted-foreground/40">
                      {data.provenance?.renderMode === 'simulated' ? 'Simulated — no real video' : 'Rendering…'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Approve button */}
          {data.hfStatus === 'ready_for_review' && (
            <button type="button" onClick={approve} disabled={disabled}
              className={cn(
                'nodrag flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[11.5px] font-medium transition-all',
                'bg-success/15 text-success hover:bg-success/25 border border-success/20 disabled:opacity-40 disabled:pointer-events-none',
              )}>
              <Check className="size-3.5" /> Approve package — include in export
            </button>
          )}

          {/* Provenance */}
          {data.provenance && (
            <button type="button" onClick={() => setShowProvenance((v) => !v)}
              className="flex w-full items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground hover:text-foreground">
              <Info className="size-3" /> Render provenance
            </button>
          )}
          {showProvenance && data.provenance && (
            <div className="rounded-lg border border-white/[0.07] bg-black/20 p-2.5 space-y-1 text-[10.5px] text-muted-foreground">
              <p><span className="text-foreground/60">Template:</span> {data.provenance.templateId} v{data.provenance.templateVersion}</p>
              <p><span className="text-foreground/60">Mode:</span> {data.provenance.renderMode}</p>
              <p><span className="text-foreground/60">Clips:</span> {data.provenance.sourceClipIds.length}</p>
              <p><span className="text-foreground/60">Ratios:</span> {data.provenance.aspectRatios.join(', ')}</p>
              <p><span className="text-foreground/60">Created:</span> {new Date(data.provenance.createdAt).toLocaleString()}</p>
            </div>
          )}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{template.label}</span>
          <span className={cn('font-mono text-[10px]',
            data.hfStatus === 'approved' ? 'text-success' :
            data.hfStatus === 'failed'   ? 'text-destructive' :
                                           'text-muted-foreground',
          )}>
            {HF_STATUS_LABEL[data.hfStatus] ?? 'Idle'}
          </span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
