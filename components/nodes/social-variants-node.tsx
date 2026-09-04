'use client'

import { type NodeProps } from '@xyflow/react'
import {
  Check, Image as ImageIcon, Lock, LockOpen, Plus, Share2, Trash2, X,
} from 'lucide-react'
import { useState } from 'react'
import { nanoid } from 'nanoid'
import { cn } from '@/lib/utils'
import type { SocialVariantsNode as SocialVariantsNodeType, SocialVariant, SocialPlatform } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'

const PLATFORM_PRESETS: Record<SocialPlatform, { label: string; ratio: SocialVariant['aspectRatio']; maxSec: number }> = {
  youtube:   { label: 'YouTube',    ratio: '16:9', maxSec: 60 },
  instagram: { label: 'Instagram',  ratio: '9:16', maxSec: 30 },
  tiktok:    { label: 'TikTok',     ratio: '9:16', maxSec: 60 },
  linkedin:  { label: 'LinkedIn',   ratio: '16:9', maxSec: 30 },
  twitter:   { label: 'Twitter / X', ratio: '16:9', maxSec: 30 },
}

const STATUS_STYLE: Record<SocialVariant['status'], { label: string; cls: string }> = {
  pending:  { label: 'Pending',  cls: 'text-muted-foreground bg-white/[0.06]' },
  ready:    { label: 'Ready',    cls: 'text-primary bg-primary/10' },
  exported: { label: 'Exported', cls: 'text-success bg-success/10' },
}

export function SocialVariantsNode({ id, data, selected }: NodeProps<SocialVariantsNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const disabled = Boolean(data.locked)

  const variants = data.variants ?? []

  const addVariant = (platform: SocialPlatform) => {
    const preset = PLATFORM_PRESETS[platform]
    const newVariant: SocialVariant = {
      id: nanoid(8),
      platform,
      label: `${preset.label} – ${preset.maxSec}s`,
      aspectRatio: preset.ratio,
      maxDurationSeconds: preset.maxSec,
      captionsRequired: platform === 'tiktok' || platform === 'instagram',
      thumbnailRequired: platform === 'youtube',
      status: 'pending',
    }
    update(id, { variants: [...variants, newVariant], status: 'draft' })
  }

  const updateVariant = (idx: number, patch: Partial<SocialVariant>) => {
    update(id, { variants: variants.map((v, i) => i === idx ? { ...v, ...patch } : v) })
  }

  const removeVariant = (idx: number) =>
    update(id, { variants: variants.filter((_, i) => i !== idx) })

  const exportedCount = variants.filter((v) => v.status === 'exported').length

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
            <ToolbarButton icon={data.locked ? LockOpen : Lock} label={data.locked ? 'Unlock' : 'Lock'}
              active={data.locked} onClick={() => act(id, data.locked ? 'unlock' : 'lock')} />
            <ToolbarDivider />
            <ToolbarButton icon={Trash2} label="Delete node" tone="danger" onClick={() => act(id, 'delete')} />
          </>
        }
      >
        <NodeHeader
          icon={Share2}
          title="Social Variants"
          subtitle="Platform cuts, captions, schedule"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3.5 px-4 py-3.5">
          {/* Add platform variants */}
          <div>
            <FieldLabel>Add platform variant</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(PLATFORM_PRESETS) as [SocialPlatform, (typeof PLATFORM_PRESETS)[SocialPlatform]][]).map(([key, preset]) => (
                <button key={key} type="button" disabled={disabled}
                  onClick={() => addVariant(key)}
                  className="nodrag rounded-lg border border-white/[0.08] bg-black/20 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground disabled:pointer-events-none">
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Variant list */}
          {variants.length > 0 && (
            <div className="space-y-1.5">
              {variants.map((v, i) => {
                const s = STATUS_STYLE[v.status]
                return (
                  <div key={v.id} className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <input value={v.label} disabled={disabled}
                        onChange={(e) => updateVariant(i, { label: e.target.value })}
                        className="w-full bg-transparent text-[11.5px] font-medium text-foreground/90 outline-none disabled:cursor-default" />
                      <p className="text-[10px] text-muted-foreground/60">
                        {v.aspectRatio} · {v.maxDurationSeconds}s
                        {v.captionsRequired ? ' · captions' : ''}
                        {v.thumbnailRequired ? ' · thumbnail' : ''}
                      </p>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium', s.cls)}>
                      {s.label}
                    </span>
                    {!disabled && (
                      <>
                        {v.status !== 'exported' && (
                          <button type="button" onClick={() => updateVariant(i, { status: 'exported' })}
                            title="Mark exported" className="shrink-0 text-muted-foreground hover:text-success">
                            <Check className="size-3" />
                          </button>
                        )}
                        <button type="button" onClick={() => removeVariant(i)} aria-label="Remove variant"
                          className="shrink-0 text-muted-foreground/30 hover:text-destructive">
                          <X className="size-3" />
                        </button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Thumbnail */}
          <div>
            <FieldLabel>Thumbnail / Key art</FieldLabel>
            {data.thumbnailUrl ? (
              <div className="group relative overflow-hidden rounded-xl border border-white/[0.08]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.thumbnailUrl} alt="Thumbnail" className="aspect-video w-full object-cover" />
                {!disabled && (
                  <button type="button" onClick={() => update(id, { thumbnailUrl: undefined })}
                    className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Remove
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <textarea value={data.thumbnailPrompt} disabled={disabled} rows={2}
                  onChange={(e) => update(id, { thumbnailPrompt: e.target.value })}
                  placeholder="Describe the thumbnail / key art…"
                  className={cn(fieldClass, 'resize-none')} />
                <label className={cn(
                  'flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.12] py-3',
                  'text-[11px] text-muted-foreground hover:border-primary/35 hover:text-foreground transition-colors',
                  disabled && 'pointer-events-none opacity-40',
                )}>
                  <ImageIcon className="size-3.5" /> Upload thumbnail
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = () => update(id, { thumbnailUrl: reader.result as string, status: 'draft' })
                      reader.readAsDataURL(file)
                      e.target.value = ''
                    }} />
                </label>
              </div>
            )}
          </div>

          {/* Publish schedule */}
          <label className="block">
            <FieldLabel>Publish schedule</FieldLabel>
            <textarea value={data.publishSchedule} disabled={disabled} rows={2}
              onChange={(e) => update(id, { publishSchedule: e.target.value })}
              placeholder="YouTube: Monday 9am UTC. Instagram Reel: Wednesday 6pm UTC…"
              className={cn(fieldClass, 'resize-none')} />
          </label>
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{variants.length} variant{variants.length !== 1 ? 's' : ''}</span>
          <span className="font-mono text-[10px]">{exportedCount} exported</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
