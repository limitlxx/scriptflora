'use client'

import { type NodeProps } from '@xyflow/react'
import { FileText, Lock, LockOpen, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  PLATFORM_OPTIONS,
  TONE_OPTIONS,
  type BriefNode as BriefNodeType,
  type ToneId,
} from '@/lib/flow-types'
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

export function BriefNode({ id, data, selected }: NodeProps<BriefNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [factInput, setFactInput] = useState('')
  const disabled = Boolean(data.locked)

  const set = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) =>
    update(id, { [key]: value })

  const togglePlatform = (p: string) => {
    const platforms = data.platforms ?? []
    set('platforms', platforms.includes(p) ? platforms.filter((x) => x !== p) : [...platforms, p])
  }

  const addFact = () => {
    const trimmed = factInput.trim()
    if (!trimmed) return
    set('keyFacts', [...(data.keyFacts ?? []), trimmed])
    setFactInput('')
  }

  const removeFact = (i: number) =>
    set('keyFacts', (data.keyFacts ?? []).filter((_, idx) => idx !== i))

  const wordCount = [data.title, data.objective, data.additionalNotes]
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={400}
        hasTarget={false}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton
              icon={Sparkles}
              label="Generate script from brief"
              onClick={() => act(id, 'regenerate')}
              disabled={disabled}
              tone="accent"
            />
            <ToolbarDivider />
            <ToolbarButton
              icon={data.locked ? LockOpen : Lock}
              label={data.locked ? 'Unlock brief' : 'Lock brief'}
              active={data.locked}
              onClick={() => act(id, data.locked ? 'unlock' : 'lock')}
            />
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
          icon={FileText}
          title="Brief"
          subtitle="Project intake"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3.5 px-4 py-3.5">
          {/* Title */}
          <label className="block">
            <FieldLabel>Title / Topic</FieldLabel>
            <input
              value={data.title}
              disabled={disabled}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. LearnWave — Series Launch"
              className={fieldClass}
            />
          </label>

          {/* Objective */}
          <label className="block">
            <FieldLabel>Objective</FieldLabel>
            <textarea
              value={data.objective}
              disabled={disabled}
              onChange={(e) => set('objective', e.target.value)}
              placeholder="What should this script achieve?"
              rows={2}
              className={cn(fieldClass, 'scroll-slim resize-none')}
            />
          </label>

          {/* Audience + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <FieldLabel>Audience</FieldLabel>
              <input
                value={data.audience}
                disabled={disabled}
                onChange={(e) => set('audience', e.target.value)}
                placeholder="Who is watching"
                className={fieldClass}
              />
            </label>
            <label className="block">
              <FieldLabel>Duration</FieldLabel>
              <input
                value={data.duration}
                disabled={disabled}
                onChange={(e) => set('duration', e.target.value)}
                placeholder="e.g. 90s, 2 min"
                className={fieldClass}
              />
            </label>
          </div>

          {/* Platforms */}
          <div>
            <FieldLabel>Platforms</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORM_OPTIONS.map((p) => {
                const active = (data.platforms ?? []).includes(p)
                return (
                  <button
                    key={p}
                    type="button"
                    disabled={disabled}
                    aria-pressed={active}
                    onClick={() => togglePlatform(p)}
                    className={cn(
                      'nodrag rounded-md border px-2 py-1 text-[11px] transition-all duration-150',
                      'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
                      active
                        ? 'border-primary/45 bg-accent-muted text-primary'
                        : 'text-muted-foreground hover:text-foreground border-white/[0.08] bg-black/20 hover:border-white/[0.15]',
                    )}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tone */}
          <div>
            <FieldLabel>Tone</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {TONE_OPTIONS.map((tone) => {
                const active = data.tone === tone.id
                return (
                  <button
                    key={tone.id}
                    type="button"
                    disabled={disabled}
                    aria-pressed={active}
                    onClick={() => set('tone', tone.id as ToneId)}
                    className={cn(
                      'nodrag rounded-md border px-2 py-1 text-[11px] transition-all duration-150',
                      'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
                      active
                        ? 'border-primary/45 bg-accent-muted text-primary'
                        : 'text-muted-foreground hover:text-foreground border-white/[0.08] bg-black/20 hover:border-white/[0.15]',
                    )}
                  >
                    {tone.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Key Facts */}
          <div>
            <FieldLabel>Key Facts (hard constraints)</FieldLabel>
            <div className="space-y-1.5">
              {(data.keyFacts ?? []).map((fact, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-white/[0.07] bg-black/20 px-2.5 py-2"
                >
                  <span className="mt-0.5 flex-1 text-[11.5px] text-foreground/85 leading-snug">{fact}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeFact(i)}
                      aria-label={`Remove fact: ${fact}`}
                      className="nodrag shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              ))}
              {!disabled && (
                <div className="flex gap-2">
                  <input
                    value={factInput}
                    onChange={(e) => setFactInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addFact()}
                    placeholder="Add a key fact, then press Enter"
                    className={cn(fieldClass, 'flex-1 text-[11.5px]')}
                  />
                  <button
                    type="button"
                    onClick={addFact}
                    disabled={!factInput.trim()}
                    aria-label="Add key fact"
                    className="nodrag flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20 text-muted-foreground hover:text-foreground hover:border-white/[0.15] disabled:opacity-40 transition-colors"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <label className="block">
            <FieldLabel>Additional Notes</FieldLabel>
            <textarea
              value={data.additionalNotes}
              disabled={disabled}
              onChange={(e) => set('additionalNotes', e.target.value)}
              placeholder="Brand rules, must-haves, things to avoid…"
              rows={2}
              className={cn(fieldClass, 'scroll-slim resize-none')}
            />
          </label>
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>Feeds the whole graph</span>
          <span className="font-mono tracking-tight">{wordCount} words</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
