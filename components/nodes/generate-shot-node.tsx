'use client'

import { type NodeProps } from '@xyflow/react'
import {
  AlertCircle, Check, ChevronDown, Clapperboard,
  DollarSign, Loader2, Lock, LockOpen, Play, Trash2, Zap,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type {
  GenerateShotNode as GenerateShotNodeType,
  GenerationPriority,
  RunwayModel,
  ShotGenerationBrief,
} from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'
import type { GenerateShotResponse } from '@/app/api/generate-shot/route'

const PRIORITY_LABELS: Record<GenerationPriority, string> = {
  draft: 'Draft (fast)',
  balanced: 'Balanced',
  final: 'Final quality',
}

const MODEL_LABELS: Record<RunwayModel, string> = {
  gen4_turbo: 'Gen-4 Turbo',
  'gen4.5': 'Gen-4.5',
  'act-two': 'Act-Two',
  aleph2: 'Aleph 2.0',
  'veo3.1': 'Veo 3.1',
}

// Derive the model the router will pick based on current settings
function previewRoute(data: GenerateShotNodeType['data']): RunwayModel {
  if (data.isEditOfExistingClip) return 'aleph2'
  if (data.priority === 'draft') return 'gen4_turbo'
  if (data.isPerformanceShot) return 'act-two'
  if (data.needsNativeAudio) return 'veo3.1'
  return 'gen4.5'
}

const CREDIT_ESTIMATE: Record<RunwayModel, number> = {
  gen4_turbo: 5,
  'gen4.5': 10,
  'act-two': 12,
  aleph2: 8,
  'veo3.1': 10,
}

export function GenerateShotNode({ id, data, selected }: NodeProps<GenerateShotNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [showBrief, setShowBrief] = useState(false)
  const disabled = Boolean(data.locked)

  const routedModel = previewRoute(data)
  const estimatedCost = CREDIT_ESTIMATE[routedModel]

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    update(id, { status: 'generating' })

    // Collect character refs and style lock from canvas
    type CanvasNode = { id: string; type?: string; data: Record<string, unknown> }
    const allNodes = ((window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined) ?? []

    const biblNode = allNodes.find((n) => n.type === 'character-bible')
    const stylNode = allNodes.find((n) => n.type === 'style-lock')

    type CharEntry = { id: string; name: string; referenceImageUrl?: string; status: string }
    const lockedChars: CharEntry[] = (
      (biblNode?.data as { characters?: CharEntry[] } | undefined)?.characters ?? []
    ).filter((c) => c.status === 'locked' && c.referenceImageUrl)

    const styleLockSnapshot = stylNode?.data ? JSON.stringify(stylNode.data) : '{}'

    // Build brief from node data + defaults
    const brief: ShotGenerationBrief = data.brief ?? {
      shotId: id,
      shotLabel: 'Shot',
      camera: '',
      action: '',
      dialogue: '',
      continuityNotes: '',
      durationTarget: '5 seconds',
      characterRefIds: lockedChars.map((c) => c.id),
      styleLockVersion: stylNode?.data?.locked ? 'locked' : 'unlocked',
      priority: data.priority,
      isEditOfExistingClip: data.isEditOfExistingClip,
      needsNativeAudio: data.needsNativeAudio,
      isPerformanceShot: data.isPerformanceShot,
    }

    try {
      const res = await fetch('/api/generate-shot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          characterRefImages: lockedChars.map((c) => ({
            id: c.id,
            imageUrl: c.referenceImageUrl!,
            name: c.name,
          })),
          styleLockSnapshot,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        setError(body.error ?? 'Generation failed.')
        update(id, { status: 'error' })
        return
      }

      const result = await res.json() as GenerateShotResponse
      update(id, {
        status: 'approved',
        selectedModel: result.modelId,
        estimatedCost: result.estimatedCost,
        // Store taskId for downstream result node to pick up
        brief: { ...brief, shotId: result.taskId },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.')
      update(id, { status: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  const setPriority = (priority: GenerationPriority) =>
    update(id, { priority, status: data.status === 'error' ? 'empty' : data.status })

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
            <ToolbarButton icon={Play} label="Generate shot" tone="accent"
              onClick={() => void handleGenerate()} disabled={disabled || generating} />
            <ToolbarDivider />
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
          icon={Clapperboard}
          title="Generate Shot"
          subtitle="Runway model router"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3 px-4 py-3.5">
          {/* Priority */}
          <div>
            <FieldLabel>Priority</FieldLabel>
            <div className="flex gap-1.5">
              {(['draft', 'balanced', 'final'] as const).map((p) => (
                <button key={p} type="button" disabled={disabled}
                  aria-pressed={data.priority === p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    'nodrag flex-1 rounded-lg border py-1.5 text-[11px] transition-all',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
                    data.priority === p
                      ? 'border-primary/45 bg-accent-muted text-primary'
                      : 'border-white/[0.08] bg-black/20 text-muted-foreground hover:border-white/[0.15] hover:text-foreground',
                  )}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Shot flags */}
          <div className="space-y-2">
            {(
              [
                ['isEditOfExistingClip', 'Edit existing clip (Aleph 2.0)'],
                ['isPerformanceShot', 'Performance / acting shot (Act-Two)'],
                ['needsNativeAudio', 'Native audio (Veo 3.1)'],
              ] as [keyof typeof data, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                disabled={disabled}
                aria-pressed={Boolean(data[key])}
                onClick={() => update(id, { [key]: !data[key] })}
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

          {/* Router preview */}
          <div className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2">
            <span className="text-[11px] text-muted-foreground">Routed to</span>
            <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-primary">
              <Zap className="size-3" />
              {MODEL_LABELS[routedModel]}
            </span>
          </div>

          {/* Cost estimate */}
          <div className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <DollarSign className="size-3" /> Estimated cost
            </span>
            <span className="font-mono text-[11.5px] text-foreground/80">
              ~{estimatedCost} credits
            </span>
          </div>

          {/* Shot brief accordion */}
          {data.brief && (
            <div>
              <button type="button"
                onClick={() => setShowBrief((v) => !v)}
                className="flex w-full items-center justify-between text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
              >
                Shot brief
                <ChevronDown className={cn('size-3 transition-transform', showBrief && 'rotate-180')} />
              </button>
              {showBrief && (
                <div className="mt-2 space-y-1.5 rounded-lg border border-white/[0.07] bg-black/20 p-2.5 text-[10.5px] text-muted-foreground">
                  {data.brief.camera && <p><span className="text-foreground/60">Camera:</span> {data.brief.camera}</p>}
                  {data.brief.action && <p><span className="text-foreground/60">Action:</span> {data.brief.action}</p>}
                  {data.brief.dialogue && <p><span className="text-foreground/60">Dialogue:</span> {data.brief.dialogue}</p>}
                  {data.brief.durationTarget && <p><span className="text-foreground/60">Duration:</span> {data.brief.durationTarget}</p>}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-2">
              <AlertCircle className="mt-0.5 size-3 shrink-0 text-destructive" />
              <p className="text-[10.5px] text-destructive/90">{error}</p>
            </div>
          )}

          {/* Generate CTA */}
          <button
            type="button"
            disabled={disabled || generating}
            onClick={() => void handleGenerate()}
            className={cn(
              'nodrag flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-medium transition-all',
              'disabled:pointer-events-none disabled:opacity-50',
              generating
                ? 'bg-primary/15 text-primary'
                : 'bg-primary text-primary-foreground hover:opacity-90',
            )}
          >
            {generating
              ? <><Loader2 className="size-4 animate-spin" />Generating…</>
              : <><Play className="size-4" />Generate shot</>
            }
          </button>
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{data.selectedModel ? `Used: ${MODEL_LABELS[data.selectedModel]}` : 'Not generated yet'}</span>
          {data.estimatedCost != null && (
            <span className="font-mono text-[10px]">{data.estimatedCost} credits</span>
          )}
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
