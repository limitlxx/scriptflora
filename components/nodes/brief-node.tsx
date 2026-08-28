'use client'

import { type NodeProps } from '@xyflow/react'
import {
  AlertTriangle, Check, FileText,
  Lock, LockOpen, Plus, RefreshCw, Sparkles, Trash2, WandSparkles, X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  PLATFORM_OPTIONS, TONE_OPTIONS,
  type BriefNode as BriefNodeType, type BriefNodeData, type ToneId,
} from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'
import { BriefGeneratorModal } from './brief-generator-modal'

export function BriefNode({ id, data, selected }: NodeProps<BriefNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [factInput, setFactInput] = useState('')
  const [generatorMode, setGeneratorMode] = useState<'generate' | 'improve' | null>(null)
  // Fields flagged as AI assumptions (amber indicator)
  const [assumedFields, setAssumedFields] = useState<string[]>([])
  // Assumptions list shown after generation
  const [assumptions, setAssumptions] = useState<string[]>([])
  // Has the user confirmed this brief? Gates pipeline generation
  const [confirmed, setConfirmed] = useState(() => data.status === 'approved')

  const disabled = Boolean(data.locked)

  const set = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) => {
    update(id, { [key]: value })
    // Editing a field manually clears its assumption flag
    setAssumedFields((prev) => prev.filter((f) => f !== key))
  }

  const isEmpty = !data.title && !data.objective && !data.audience
  const isPartial = !isEmpty && (!data.title || !data.objective || !data.duration)

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

  // Called when the modal confirms a generated/improved brief
  const handleGeneratorConfirm = (patch: Partial<BriefNodeData>, newAssumptions: string[]) => {
    update(id, { ...patch, status: 'draft' })
    // Flag fields that were inferred (not explicitly provided)
    const flagged = newAssumptions.map((a) => a.split(':')[0].trim().toLowerCase())
    setAssumedFields(flagged)
    setAssumptions(newAssumptions)
    setConfirmed(false)
    setGeneratorMode(null)
  }

  const handleConfirm = () => {
    setConfirmed(true)
    setAssumptions([])
    setAssumedFields([])
    update(id, { status: 'approved' })
  }

  const wordCount = [data.title, data.objective, data.additionalNotes]
    .join(' ').trim().split(/\s+/).filter(Boolean).length

  const assumptionLabel = (key: string) =>
    assumedFields.some((f) => f.includes(key))
      ? <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-sm bg-warning/15 px-1 py-0.5 text-[9px] font-medium text-warning/90"><AlertTriangle className="size-2.5" />inferred</span>
      : null

  return (
    <>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <NodeShell
          selected={selected}
          locked={data.locked}
          status={data.status}
          width={408}
          hasTarget={false}
          toolbarVisible={selected || hovered}
          toolbar={
            <>
              <ToolbarButton
                icon={Sparkles}
                label="Generate script from brief"
                onClick={() => act(id, 'regenerate')}
                disabled={disabled || !confirmed}
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

          {/* ── AI Generate / Improve CTAs ── */}
          {!disabled && (
            <div className="flex gap-2 px-4 pt-3.5 pb-1">
              {isEmpty ? (
                <button
                  type="button"
                  onClick={() => setGeneratorMode('generate')}
                  className={cn(
                    'nodrag flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-medium',
                    'bg-primary text-primary-foreground hover:opacity-90 transition-opacity',
                  )}
                >
                  <WandSparkles className="size-3.5" />
                  Generate Brief from idea
                </button>
              ) : (
                <>
                  {isPartial && (
                    <button
                      type="button"
                      onClick={() => setGeneratorMode('generate')}
                      className="nodrag flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary/35 py-1.5 text-[11.5px] font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      <WandSparkles className="size-3" />
                      Generate Brief
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setGeneratorMode('improve')}
                    className="nodrag flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.09] py-1.5 text-[11.5px] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
                  >
                    <RefreshCw className="size-3" />
                    Improve Brief
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Assumptions notice ── */}
          {assumptions.length > 0 && !confirmed && (
            <div className="mx-4 mt-2 rounded-lg border border-warning/25 bg-warning/8 p-2.5">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-medium text-warning/90">
                <AlertTriangle className="size-3" />
                {assumptions.length} assumption{assumptions.length > 1 ? 's' : ''} made — review before confirming
              </div>
              <ul className="space-y-0.5">
                {assumptions.map((a, i) => (
                  <li key={i} className="text-[10.5px] text-muted-foreground leading-snug">• {a}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3.5 px-4 py-3.5">
            {/* Title */}
            <label className="block">
              <FieldLabel>Title / Topic {assumptionLabel('title')}</FieldLabel>
              <input
                value={data.title}
                disabled={disabled}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. LearnWave — Series Launch"
                className={cn(fieldClass, assumedFields.includes('title') && 'border-warning/30')}
              />
            </label>

            {/* Objective */}
            <label className="block">
              <FieldLabel>Objective {assumptionLabel('objective')}</FieldLabel>
              <textarea
                value={data.objective}
                disabled={disabled}
                onChange={(e) => set('objective', e.target.value)}
                placeholder="What should this script achieve?"
                rows={2}
                className={cn(fieldClass, 'scroll-slim resize-none', assumedFields.includes('objective') && 'border-warning/30')}
              />
            </label>

            {/* Audience + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <FieldLabel>Audience {assumptionLabel('audience')}</FieldLabel>
                <input
                  value={data.audience}
                  disabled={disabled}
                  onChange={(e) => set('audience', e.target.value)}
                  placeholder="Who is watching"
                  className={cn(fieldClass, assumedFields.includes('audience') && 'border-warning/30')}
                />
              </label>
              <label className="block">
                <FieldLabel>Duration {assumptionLabel('duration')}</FieldLabel>
                <input
                  value={data.duration}
                  disabled={disabled}
                  onChange={(e) => set('duration', e.target.value)}
                  placeholder="e.g. 90s, 2 min"
                  className={cn(fieldClass, assumedFields.includes('duration') && 'border-warning/30')}
                />
              </label>
            </div>

            {/* Platforms */}
            <div>
              <FieldLabel>Platforms {assumptionLabel('platforms')}</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORM_OPTIONS.map((p) => {
                  const active = (data.platforms ?? []).includes(p)
                  return (
                    <button key={p} type="button" disabled={disabled} aria-pressed={active}
                      onClick={() => togglePlatform(p)}
                      className={cn('nodrag rounded-md border px-2 py-1 text-[11px] transition-all duration-150 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
                        active ? 'border-primary/45 bg-accent-muted text-primary' : 'text-muted-foreground hover:text-foreground border-white/[0.08] bg-black/20 hover:border-white/[0.15]',
                      )}
                    >{p}</button>
                  )
                })}
              </div>
            </div>

            {/* Tone */}
            <div>
              <FieldLabel>Tone {assumptionLabel('tone')}</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {TONE_OPTIONS.map((tone) => {
                  const active = data.tone === tone.id
                  return (
                    <button key={tone.id} type="button" disabled={disabled} aria-pressed={active}
                      onClick={() => set('tone', tone.id as ToneId)}
                      className={cn('nodrag rounded-md border px-2 py-1 text-[11px] transition-all duration-150 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
                        active ? 'border-primary/45 bg-accent-muted text-primary' : 'text-muted-foreground hover:text-foreground border-white/[0.08] bg-black/20 hover:border-white/[0.15]',
                      )}
                    >{tone.label}</button>
                  )
                })}
              </div>
            </div>

            {/* Key Facts */}
            <div>
              <FieldLabel>Key Facts (hard constraints) {assumptionLabel('keyfacts')}</FieldLabel>
              <div className="space-y-1.5">
                {(data.keyFacts ?? []).map((fact, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-white/[0.07] bg-black/20 px-2.5 py-2">
                    <span className="mt-0.5 flex-1 text-[11.5px] text-foreground/85 leading-snug">{fact}</span>
                    {!disabled && (
                      <button type="button" onClick={() => removeFact(i)} aria-label={`Remove fact: ${fact}`} className="nodrag shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
                {!disabled && (
                  <div className="flex gap-2">
                    <input value={factInput} onChange={(e) => setFactInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addFact()}
                      placeholder="Add a key fact, then press Enter"
                      className={cn(fieldClass, 'flex-1 text-[11.5px]')}
                    />
                    <button type="button" onClick={addFact} disabled={!factInput.trim()} aria-label="Add key fact"
                      className="nodrag flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20 text-muted-foreground hover:text-foreground hover:border-white/[0.15] disabled:opacity-40 transition-colors"
                    ><Plus className="size-3.5" /></button>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <label className="block">
              <FieldLabel>Additional Notes</FieldLabel>
              <textarea value={data.additionalNotes} disabled={disabled}
                onChange={(e) => set('additionalNotes', e.target.value)}
                placeholder="Brand rules, must-haves, things to avoid…"
                rows={2} className={cn(fieldClass, 'scroll-slim resize-none')}
              />
            </label>
          </div>

          <NodeDivider />

          {/* ── Confirm Brief gate ── */}
          {!disabled && !isEmpty && (
            <div className="px-4 pb-3.5 pt-2">
              {confirmed ? (
                <div className="flex items-center justify-between rounded-xl border border-success/25 bg-success/10 px-3 py-2">
                  <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-success">
                    <Check className="size-3.5" />
                    Brief confirmed — pipeline generation unlocked
                  </span>
                  <button type="button" onClick={() => { setConfirmed(false); update(id, { status: 'draft' }) }}
                    className="text-[10.5px] text-muted-foreground hover:text-foreground transition-colors">
                    Edit
                  </button>
                </div>
              ) : (
                <button type="button" onClick={handleConfirm}
                  className={cn(
                    'nodrag flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12.5px] font-medium transition-all',
                    'bg-success/15 text-success hover:bg-success/25 border border-success/20',
                  )}
                >
                  <Check className="size-3.5" />
                  Confirm Brief &amp; unlock pipeline
                </button>
              )}
            </div>
          )}

          <NodeFooter>
            <span>Feeds the whole graph</span>
            <span className="font-mono tracking-tight">{wordCount} words</span>
          </NodeFooter>
        </NodeShell>
      </div>

      {/* Generator modal — rendered outside the node shell to avoid z-index issues */}
      {generatorMode && (
        <BriefGeneratorModal
          existing={data}
          mode={generatorMode}
          onConfirm={handleGeneratorConfirm}
          onClose={() => setGeneratorMode(null)}
        />
      )}
    </>
  )
}
