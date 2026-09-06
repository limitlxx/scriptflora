'use client'

import { type NodeProps } from '@xyflow/react'
import {
  Check, ChevronDown, ChevronUp, Image as ImageIcon,
  Loader2, Lock, LockOpen, Mic, Plus, Sparkles, Trash2, User, Users, X,
} from 'lucide-react'
import { useState } from 'react'
import { nanoid } from 'nanoid'
import { cn } from '@/lib/utils'
import type { CharacterBibleNode as CharacterBibleNodeType, CharacterEntry } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'

function emptyCharacter(): CharacterEntry {
  return {
    id: nanoid(8),
    name: '',
    role: '',
    goals: '',
    traits: '',
    visualDescription: '',
    wardrobe: '',
    referenceImageUrl: undefined,
    voiceProfile: { voiceId: '', tone: '', style: '', sampleNotes: '' },
    status: 'draft',
  }
}

// ── Reference Image Generator ─────────────────────────────────────────────────

function ReferenceImageGenerator({
  existingUrl,
  disabled,
  prompt: autoPrompt,
  type,
  onSelect,
  onRemove,
}: {
  existingUrl?: string
  disabled: boolean
  prompt: string
  type: 'character' | 'style'
  onSelect: (url: string) => void
  onRemove: () => void
}) {
  const [genOpen, setGenOpen] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [sourcePreview, setSourcePreview] = useState<string | null>(null)
  const [variants, setVariants] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(2)

  const generate = async () => {
    setLoading(true)
    setError(null)
    setVariants([])
    try {
      const res = await fetch('/api/generate-reference-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt.trim() || autoPrompt,
          type,
          count,
          sourceImage: sourcePreview ?? undefined,
        }),
      })
      const data = await res.json() as { images?: string[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setVariants(data.images ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setSourcePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  if (existingUrl) {
    return (
      <div className="space-y-2">
        <div className="group relative overflow-hidden rounded-lg border border-success/25">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={existingUrl} alt="Reference" className="h-32 w-full object-cover" />
          {!disabled && (
            <button type="button" onClick={onRemove}
              className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-2.5" /> Remove
            </button>
          )}
          <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-md bg-success/20 px-1.5 py-0.5 text-[9px] font-medium text-success">
            <Check className="size-2.5" /> Set
          </span>
        </div>
        {!disabled && (
          <button type="button" onClick={() => { setGenOpen(true); setVariants([]) }}
            className="nodrag flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.07] py-1.5 text-[10.5px] text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
          >
            <Sparkles className="size-3" /> Regenerate variants
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Upload or generate toggle */}
      <div className="flex gap-1.5">
        <label className={cn(
          'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed py-2.5',
          'border-white/[0.12] text-[10.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground',
          disabled && 'pointer-events-none opacity-40',
        )}>
          <ImageIcon className="size-3.5" />
          Upload image
          <input type="file" accept="image/*" className="hidden" disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              handleFileUpload(file)
              onSelect(URL.createObjectURL(file))
              e.target.value = ''
            }}
          />
        </label>
        <button type="button" disabled={disabled}
          onClick={() => setGenOpen((v) => !v)}
          className={cn(
            'nodrag flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2.5 text-[10.5px] transition-colors',
            genOpen
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-white/[0.12] text-muted-foreground hover:border-primary/30 hover:text-foreground',
            disabled && 'pointer-events-none opacity-40',
          )}
        >
          <Sparkles className="size-3.5" />
          Generate
        </button>
      </div>

      {/* Generator panel */}
      {genOpen && !disabled && (
        <div className="space-y-2.5 rounded-xl border border-white/[0.08] bg-black/20 p-3">
          {/* Source image (optional, for variation) */}
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
                <ImageIcon className="size-3" /> Upload source image
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = '' }}
                />
              </label>
            )}
          </div>

          {/* Custom prompt */}
          <div>
            <FieldLabel>Prompt override (or leave blank to use description)</FieldLabel>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={2}
              placeholder={autoPrompt || `Describe the ${type === 'character' ? 'character' : 'visual style'}…`}
              className={cn(fieldClass, 'resize-none text-[11px]')}
            />
          </div>

          {/* Variant count */}
          <div className="flex items-center gap-2">
            <FieldLabel>Variants</FieldLabel>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((n) => (
                <button key={n} type="button" onClick={() => setCount(n)}
                  className={cn(
                    'nodrag size-6 rounded-md text-[11px] transition-colors',
                    count === n ? 'bg-primary/25 text-primary' : 'bg-white/[0.05] text-muted-foreground hover:bg-white/[0.09]',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={() => void generate()} disabled={loading}
            className="nodrag flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/15 py-2 text-[11.5px] font-medium text-primary hover:bg-primary/25 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {loading ? 'Generating…' : 'Generate reference'}
          </button>

          {error && <p className="text-[10.5px] text-destructive">{error}</p>}

          {/* Variants grid */}
          {variants.length > 0 && (
            <div>
              <FieldLabel>Select a variant to use</FieldLabel>
              <div className={cn('grid gap-2', variants.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                {variants.map((url, i) => (
                  <button key={i} type="button"
                    onClick={() => { onSelect(url); setGenOpen(false) }}
                    className="nodrag group relative overflow-hidden rounded-lg border border-white/[0.08] transition-colors hover:border-primary/50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Variant ${i + 1}`} className="aspect-square w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="rounded-lg bg-primary/90 px-2.5 py-1 text-[11px] font-medium text-white">Use this</span>
                    </div>
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
                      {i + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── CharacterCard ─────────────────────────────────────────────────────────────

function CharacterCard({
  char,
  disabled,
  onChange,
  onRemove,
}: {
  char: CharacterEntry
  disabled: boolean
  onChange: (patch: Partial<CharacterEntry>) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const locked = char.status === 'locked'

  const toggleLock = () => onChange({ status: locked ? 'draft' : 'locked' })

  return (
    <div className={cn(
      'rounded-xl border transition-all duration-200',
      locked ? 'border-success/30 bg-success/5' : 'border-white/[0.08] bg-black/20',
    )}>
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <User className="size-3 text-primary" />
        </span>
        <input
          value={char.name}
          disabled={disabled || locked}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Character name"
          className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-foreground/90 outline-none placeholder:text-muted-foreground/50 disabled:cursor-default"
        />
        {locked && <span className="shrink-0 rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] font-medium text-success">Locked</span>}
        <button
          type="button"
          onClick={toggleLock}
          disabled={disabled}
          title={locked ? 'Unlock character' : 'Lock character'}
          aria-label={locked ? 'Unlock character' : 'Lock character'}
          className="shrink-0 text-muted-foreground hover:text-foreground disabled:pointer-events-none"
        >
          {locked ? <Lock className="size-3" /> : <LockOpen className="size-3" />}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Collapse character' : 'Expand character'}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        {!disabled && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove character"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-3 border-t border-white/[0.06] px-3 pb-3 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <FieldLabel>Role</FieldLabel>
              <input value={char.role} disabled={disabled || locked}
                onChange={(e) => onChange({ role: e.target.value })}
                placeholder="Protagonist" className={fieldClass} />
            </label>
            <label className="block">
              <FieldLabel>Goals</FieldLabel>
              <input value={char.goals} disabled={disabled || locked}
                onChange={(e) => onChange({ goals: e.target.value })}
                placeholder="What they want" className={fieldClass} />
            </label>
          </div>

          <label className="block">
            <FieldLabel>Traits</FieldLabel>
            <input value={char.traits} disabled={disabled || locked}
              onChange={(e) => onChange({ traits: e.target.value })}
              placeholder="Personality, mannerisms" className={fieldClass} />
          </label>

          <label className="block">
            <FieldLabel>Visual description</FieldLabel>
            <textarea value={char.visualDescription} disabled={disabled || locked}
              onChange={(e) => onChange({ visualDescription: e.target.value })}
              placeholder="Age, build, face, distinctive features…" rows={2}
              className={cn(fieldClass, 'resize-none')} />
          </label>

          <label className="block">
            <FieldLabel>Wardrobe &amp; body language</FieldLabel>
            <textarea value={char.wardrobe} disabled={disabled || locked}
              onChange={(e) => onChange({ wardrobe: e.target.value })}
              placeholder="Signature clothing, posture, gestures…" rows={2}
              className={cn(fieldClass, 'resize-none')} />
          </label>

          {/* Reference image */}
          <div>
            <FieldLabel>
              <span className="flex items-center gap-1.5">
                <ImageIcon className="size-2.5" /> Reference image
                {!char.referenceImageUrl && (
                  <span className="rounded-sm bg-warning/15 px-1 py-0.5 text-[9px] font-medium text-warning/90">
                    Required before video
                  </span>
                )}
              </span>
            </FieldLabel>
            <ReferenceImageGenerator
              existingUrl={char.referenceImageUrl}
              disabled={disabled || locked}
              prompt={[char.name, char.role, char.visualDescription, char.wardrobe].filter(Boolean).join('. ')}
              type="character"
              onSelect={(url) => onChange({ referenceImageUrl: url })}
              onRemove={() => onChange({ referenceImageUrl: undefined })}
            />
          </div>

          {/* Voice profile */}
          <div>
            <button type="button"
              onClick={() => setVoiceOpen((v) => !v)}
              className="flex w-full items-center justify-between text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-1.5"><Mic className="size-2.5" /> Voice profile</span>
              {voiceOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>
            {voiceOpen && (
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <FieldLabel>Voice ID</FieldLabel>
                    <input value={char.voiceProfile.voiceId} disabled={disabled || locked}
                      onChange={(e) => onChange({ voiceProfile: { ...char.voiceProfile, voiceId: e.target.value } })}
                      placeholder="e.g. ElevenLabs ID" className={fieldClass} />
                  </label>
                  <label className="block">
                    <FieldLabel>Tone</FieldLabel>
                    <input value={char.voiceProfile.tone} disabled={disabled || locked}
                      onChange={(e) => onChange({ voiceProfile: { ...char.voiceProfile, tone: e.target.value } })}
                      placeholder="warm, gravelly…" className={fieldClass} />
                  </label>
                </div>
                <label className="block">
                  <FieldLabel>Style &amp; notes</FieldLabel>
                  <input value={char.voiceProfile.style} disabled={disabled || locked}
                    onChange={(e) => onChange({ voiceProfile: { ...char.voiceProfile, style: e.target.value } })}
                    placeholder="Calm narrator, fast-paced delivery…" className={fieldClass} />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function CharacterBibleNode({ id, data, selected }: NodeProps<CharacterBibleNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const disabled = Boolean(data.locked)

  const setChars = (chars: CharacterEntry[]) => update(id, { characters: chars, status: 'draft' })

  const addChar = () => setChars([...(data.characters ?? []), emptyCharacter()])

  const updateChar = (idx: number, patch: Partial<CharacterEntry>) => {
    const chars = [...(data.characters ?? [])]
    chars[idx] = { ...chars[idx], ...patch }
    setChars(chars)
  }

  const removeChar = (idx: number) =>
    setChars((data.characters ?? []).filter((_, i) => i !== idx))

  const lockedCount = (data.characters ?? []).filter((c) => c.status === 'locked').length
  const hasUnimaged = (data.characters ?? []).some(
    (c) => c.status === 'locked' && !c.referenceImageUrl,
  )

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={420}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton
              icon={data.locked ? LockOpen : Lock}
              label={data.locked ? 'Unlock node' : 'Lock node'}
              active={data.locked}
              onClick={() => act(id, data.locked ? 'unlock' : 'lock')}
            />
            <ToolbarDivider />
            <ToolbarButton icon={Trash2} label="Delete node" tone="danger" onClick={() => act(id, 'delete')} />
          </>
        }
      >
        <NodeHeader
          icon={Users}
          title="Character Bible"
          subtitle="Identity lock for characters"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        {hasUnimaged && (
          <div className="mx-3 mt-3 flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/8 px-2.5 py-2">
            <ImageIcon className="mt-0.5 size-3 shrink-0 text-warning" />
            <p className="text-[10.5px] text-warning/90">
              Locked character(s) missing reference image — video generation blocked until image is added.
            </p>
          </div>
        )}

        <div className="space-y-2 px-3 py-3">
          {(data.characters ?? []).map((char, i) => (
            <CharacterCard
              key={char.id}
              char={char}
              disabled={disabled}
              onChange={(patch) => updateChar(i, patch)}
              onRemove={() => removeChar(i)}
            />
          ))}

          {!disabled && (
            <button
              type="button"
              onClick={addChar}
              className={cn(
                'flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.12] py-2',
                'text-[11.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground',
              )}
            >
              <Plus className="size-3.5" />
              Add character
            </button>
          )}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{data.characters?.length ?? 0} character{(data.characters?.length ?? 0) !== 1 ? 's' : ''}</span>
          <span className="font-mono text-[10px]">{lockedCount} locked</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
