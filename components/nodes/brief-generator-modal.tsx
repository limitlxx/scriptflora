'use client'

import { useRef, useState } from 'react'
import { AlertCircle, Loader2, RefreshCw, Sparkles, WandSparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLATFORM_OPTIONS, TONE_OPTIONS, type BriefNodeData, type ToneId } from '@/lib/flow-types'
import type { GenerateBriefResult } from '@/app/api/generate-brief/route'
import { fieldClass } from './node-shell'

type Props = {
  existing: BriefNodeData
  mode: 'generate' | 'improve'
  onConfirm: (brief: Partial<BriefNodeData>, assumptions: string[]) => void
  onClose: () => void
}

const DURATION_OPTIONS = ['15s', '30s', '60s', '90s', '2 min', '3 min', '5 min', '10 min']

export function BriefGeneratorModal({ existing, mode, onConfirm, onClose }: Props) {
  const [idea, setIdea] = useState(() => {
    if (mode === 'improve') {
      const parts = [existing.title, existing.objective].filter(Boolean)
      return parts.join(' — ')
    }
    return ''
  })
  const [platform, setPlatform] = useState(existing.platforms?.[0] ?? '')
  const [duration, setDuration] = useState(existing.duration ?? '')
  const [audience, setAudience] = useState(existing.audience ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const areaRef = useRef<HTMLTextAreaElement>(null)

  const handleGenerate = async () => {
    if (!idea.trim()) { setError('Describe your idea first.'); return }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim(), platform: platform || undefined, duration: duration || undefined, audience: audience || undefined }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        setError(body.error ?? 'Generation failed. Try again.')
        setLoading(false)
        return
      }

      const result = await res.json() as GenerateBriefResult

      // In improve mode, only overwrite empty / default fields
      const patch: Partial<BriefNodeData> = mode === 'generate'
        ? {
            title: result.title,
            objective: result.objective,
            audience: result.audience,
            platforms: result.platforms as string[],
            duration: result.duration,
            tone: (TONE_OPTIONS.find((t) => t.id === result.tone)?.id ?? 'cinematic') as ToneId,
            keyFacts: result.keyFacts,
            additionalNotes: result.additionalNotes,
          }
        : {
            title: existing.title || result.title,
            objective: existing.objective || result.objective,
            audience: existing.audience || result.audience,
            platforms: existing.platforms?.length ? existing.platforms : result.platforms as string[],
            duration: existing.duration || result.duration,
            tone: existing.tone || (result.tone as ToneId),
            keyFacts: [...(existing.keyFacts ?? []), ...result.keyFacts.filter((f) => !(existing.keyFacts ?? []).includes(f))],
            additionalNotes: existing.additionalNotes || result.additionalNotes,
          }

      onConfirm(patch, result.assumptions ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Generate brief from idea"
      onMouseDown={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[oklch(0.16_0.005_285)] p-5 shadow-2xl animate-in fade-in-0 slide-in-from-bottom-3 duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <WandSparkles className="size-4" />
          </span>
          <div>
            <h2 className="text-[13.5px] font-medium text-foreground">
              {mode === 'generate' ? 'Generate Brief from idea' : 'Improve existing Brief'}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {mode === 'generate'
                ? 'Describe what you want to create — AI fills the rest.'
                : 'AI will fill in empty fields without overwriting your work.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/[0.07] hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Idea textarea */}
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              {mode === 'generate' ? 'Describe what you want to create *' : 'What should be improved?'}
            </label>
            <textarea
              ref={areaRef}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. A 60-second product launch video for a new AI writing tool targeting busy marketing teams at SaaS companies. Punchy, confident tone. No jargon."
              rows={4}
              className={cn(fieldClass, 'scroll-slim resize-none w-full text-[12.5px]')}
              autoFocus
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void handleGenerate() }}
            />
            <p className="mt-1 text-[10px] text-muted-foreground/50">⌘ Enter to generate</p>
          </div>

          {/* Optional quick fields */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className={cn(fieldClass, 'text-[11px]')}
              >
                <option value="">Any</option>
                {PLATFORM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={cn(fieldClass, 'text-[11px]')}
              >
                <option value="">Auto</option>
                {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Audience hint</label>
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. devs, 25–35"
                className={cn(fieldClass, 'text-[11px]')}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
              <AlertCircle className="mt-0.5 size-3 shrink-0 text-destructive" />
              <p className="text-[11.5px] text-destructive/90">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={loading || !idea.trim()}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium transition-all',
                'disabled:pointer-events-none disabled:opacity-50',
                loading ? 'bg-primary/20 text-primary' : 'bg-primary text-primary-foreground hover:opacity-90',
              )}
            >
              {loading
                ? <><Loader2 className="size-4 animate-spin" />Generating…</>
                : <><Sparkles className="size-4" />{mode === 'generate' ? 'Generate Brief' : 'Improve Brief'}</>
              }
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/[0.09] px-4 py-2.5 text-[13px] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
