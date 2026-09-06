'use client'

import { type NodeProps } from '@xyflow/react'
import { Check, Globe, ImageIcon, Loader2, Lock, LockOpen, Sparkles, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { StyleLockNode as StyleLockNodeType } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'

const MEDIUM_OPTIONS = [
  { id: 'live-action', label: 'Live-action' },
  { id: 'animation', label: 'Animation' },
  { id: 'hybrid', label: 'Hybrid' },
] as const

export function StyleLockNode({ id, data, selected }: NodeProps<StyleLockNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [genOpen, setGenOpen] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [sourcePreview, setSourcePreview] = useState<string | null>(null)
  const [variants, setVariants] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [variantCount, setVariantCount] = useState(2)
  const [pinnedImages, setPinnedImages] = useState<string[]>([])

  const disabled = Boolean(data.locked)

  const set = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) =>
    update(id, { [key]: value, status: 'draft' })

  const handleLockStyle = () => {
    update(id, { locked: !data.locked, status: data.locked ? 'draft' : 'approved' })
  }

  const isComplete = data.visualRules?.trim() && data.hardConstraints?.trim()

  const autoPrompt = [
    data.medium && `Medium: ${data.medium}`,
    data.visualRules && data.visualRules.slice(0, 200),
    data.locations && `Locations: ${data.locations.slice(0, 100)}`,
    data.hardConstraints && `Constraints: ${data.hardConstraints.slice(0, 100)}`,
  ].filter(Boolean).join('. ')

  const generateMoodBoard = async () => {
    setLoading(true)
    setGenError(null)
    setVariants([])
    try {
      const res = await fetch('/api/generate-reference-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt.trim() || autoPrompt,
          type: 'style',
          count: variantCount,
          sourceImage: sourcePreview ?? undefined,
        }),
      })
      const result = await res.json() as { images?: string[]; error?: string }
      if (!res.ok) throw new Error(result.error ?? 'Generation failed')
      setVariants(result.images ?? [])
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={380}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton
              icon={data.locked ? LockOpen : Lock}
              label={data.locked ? 'Unlock style' : 'Lock style'}
              active={data.locked}
              onClick={handleLockStyle}
            />
            <ToolbarDivider />
            <ToolbarButton icon={Trash2} label="Delete node" tone="danger" onClick={() => act(id, 'delete')} />
          </>
        }
      >
        <NodeHeader
          icon={Globe}
          title="World / Style Lock"
          subtitle="Visual rules for the whole project"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3.5 px-4 py-3.5">
          {/* Medium */}
          <div>
            <FieldLabel>Medium</FieldLabel>
            <div className="flex gap-1.5">
              {MEDIUM_OPTIONS.map((opt) => {
                const active = data.medium === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={disabled}
                    aria-pressed={active}
                    onClick={() => set('medium', opt.id)}
                    className={cn(
                      'nodrag flex-1 rounded-lg border py-1.5 text-[11px] transition-all duration-150',
                      'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
                      active
                        ? 'border-primary/45 bg-accent-muted text-primary'
                        : 'border-white/[0.08] bg-black/20 text-muted-foreground hover:border-white/[0.15] hover:text-foreground',
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Visual rules */}
          <label className="block">
            <FieldLabel>Visual rules &amp; palette</FieldLabel>
            <textarea value={data.visualRules} disabled={disabled}
              onChange={(e) => set('visualRules', e.target.value)}
              placeholder="Color palette, era, lighting mood, grain level, lens style…"
              rows={3} className={cn(fieldClass, 'resize-none')}
            />
          </label>

          {/* Locations */}
          <label className="block">
            <FieldLabel>Key locations</FieldLabel>
            <textarea value={data.locations} disabled={disabled}
              onChange={(e) => set('locations', e.target.value)}
              placeholder="Interior darkroom, coastal cliff, city rooftop…"
              rows={2} className={cn(fieldClass, 'resize-none')}
            />
          </label>

          {/* Hard constraints */}
          <label className="block">
            <FieldLabel>Hard constraints — must never change</FieldLabel>
            <textarea value={data.hardConstraints} disabled={disabled}
              onChange={(e) => set('hardConstraints', e.target.value)}
              placeholder="No daylight scenes. Brand colour #1A2B3C must appear. No CGI backgrounds."
              rows={2} className={cn(fieldClass, 'resize-none')}
            />
          </label>

          {/* ── Mood board generator ── */}
          <div>
            <button type="button"
              onClick={() => setGenOpen((v) => !v)}
              className="nodrag flex w-full items-center justify-between text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-2.5 text-primary/70" /> Mood board / style references
              </span>
              <span className={cn('text-[9px] rounded-full px-1.5 py-0.5 transition-colors',
                genOpen ? 'bg-primary/15 text-primary' : 'bg-white/[0.05]')}>
                {genOpen ? 'Close' : 'Generate'}
              </span>
            </button>

            {/* Pinned images strip */}
            {pinnedImages.length > 0 && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 scroll-slim">
                {pinnedImages.map((url, i) => (
                  <div key={i} className="group relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Style ref ${i + 1}`} className="h-16 w-16 rounded-lg object-cover border border-white/[0.1]" />
                    <button type="button" onClick={() => setPinnedImages((p) => p.filter((_, j) => j !== i))}
                      className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {genOpen && (
              <div className="mt-2 space-y-2.5 rounded-xl border border-white/[0.08] bg-black/20 p-3">
                {/* Source image */}
                <div>
                  <FieldLabel>Source image (optional — for variation)</FieldLabel>
                  {sourcePreview ? (
                    <div className="group relative overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sourcePreview} alt="Source" className="h-20 w-full object-cover rounded-lg" />
                      <button type="button" onClick={() => setSourcePreview(null)}
                        className="absolute right-1 top-1 rounded-md bg-black/70 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/[0.10] py-2 text-[10.5px] text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors">
                      <ImageIcon className="size-3" /> Upload reference
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          const reader = new FileReader()
                          reader.onload = () => setSourcePreview(reader.result as string)
                          reader.readAsDataURL(f)
                          e.target.value = ''
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Prompt override */}
                <div>
                  <FieldLabel>Prompt (or leave blank to use rules above)</FieldLabel>
                  <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={2} placeholder={autoPrompt || 'Describe the visual style…'}
                    className={cn(fieldClass, 'resize-none text-[11px]')}
                  />
                </div>

                {/* Variant count */}
                <div className="flex items-center gap-2">
                  <FieldLabel>Variants</FieldLabel>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <button key={n} type="button" onClick={() => setVariantCount(n)}
                        className={cn(
                          'nodrag size-6 rounded-md text-[11px] transition-colors',
                          variantCount === n ? 'bg-primary/25 text-primary' : 'bg-white/[0.05] text-muted-foreground hover:bg-white/[0.09]',
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="button" onClick={() => void generateMoodBoard()} disabled={loading}
                  className="nodrag flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/15 py-2 text-[11.5px] font-medium text-primary hover:bg-primary/25 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                  {loading ? 'Generating…' : 'Generate mood board'}
                </button>

                {genError && <p className="text-[10.5px] text-destructive">{genError}</p>}

                {variants.length > 0 && (
                  <div>
                    <FieldLabel>Click to pin as style reference</FieldLabel>
                    <div className={cn('grid gap-2', variants.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                      {variants.map((url, i) => (
                        <button key={i} type="button"
                          onClick={() => setPinnedImages((p) => [...p, url])}
                          className="nodrag group relative overflow-hidden rounded-lg border border-white/[0.08] transition-colors hover:border-primary/50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Style ${i + 1}`} className="aspect-square w-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="rounded-lg bg-primary/90 px-2.5 py-1 text-[11px] font-medium text-white">Pin</span>
                          </div>
                          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">{i + 1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lock CTA */}
          {!disabled && isComplete && (
            <button type="button" onClick={handleLockStyle}
              className="nodrag flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-medium transition-all bg-success/15 text-success hover:bg-success/25 border border-success/20"
            >
              <Check className="size-3.5" />
              Lock style rules — inject into all generations
            </button>
          )}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{data.medium ?? 'Medium not set'}</span>
          {data.locked && (
            <span className="flex items-center gap-1 text-success">
              <Check className="size-2.5" /> Rules locked
            </span>
          )}
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
