'use client'

/**
 * SandboxWizard — 3-step no-auth demo flow.
 * Step 1: describe your idea
 * Step 2: choose skill (Standard or Auteur)
 * Step 3: watch it generate + read results
 *
 * ponytail: all state local, no store integration. Sandbox results are
 * ephemeral — producer sees the value, then signs up if they want to save.
 * Unlimited generations — no localStorage gate.
 */

import { useState } from 'react'
import { ArrowRight, Check, Download, Layers, Loader2, RefreshCw, Sparkles, WandSparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GenerationPlan, BriefNodeData, SkillId } from '@/lib/flow-types'
import type { GenerateBriefResult } from '@/app/api/generate-brief/route'

type Step = 'idea' | 'skill' | 'generating' | 'result'

const SKILL_OPTIONS = [
  {
    id: 'standard' as SkillId,
    name: 'Standard Script',
    tagline: 'Hook, scenes, dialogue, visual direction, CTA. Best for brand and social work.',
    icon: Layers,
  },
  {
    id: 'auteur' as SkillId,
    name: 'Auteur Method',
    tagline: 'Stageplay → Screenplay → Technical → Production Summary → Auteur Script. For generative video.',
    icon: WandSparkles,
  },
]

const KIND_ORDER = ['hook', 'scene', 'dialogue', 'visual', 'cta',
  'auteur-stageplay', 'auteur-screenplay', 'auteur-technical', 'auteur-production-summary', 'auteur-script']

const KIND_LABEL: Record<string, string> = {
  hook: 'Hook',
  scene: 'Scene',
  dialogue: 'Dialogue',
  visual: 'Visual Directions',
  cta: 'Call to Action',
  'auteur-stageplay': 'Stageplay',
  'auteur-screenplay': 'Screenplay',
  'auteur-technical': 'Technical Screenplay',
  'auteur-production-summary': 'Production Summary',
  'auteur-script': 'Auteur Script',
}

export function SandboxWizard({ onSignUp }: { onSignUp: () => void }) {
  const [step, setStep] = useState<Step>('idea')
  const [idea, setIdea] = useState('')
  const [skill, setSkill] = useState<SkillId>('standard')
  const [brief, setBrief] = useState<BriefNodeData | null>(null)
  const [plan, setPlan] = useState<GenerationPlan | null>(null)
  const [error, setError] = useState('')
  const [briefLoading, setBriefLoading] = useState(false)

  const handleIdeaNext = async () => {
    if (!idea.trim()) return
    setError('')
    setBriefLoading(true)
    try {
      const res = await fetch('/api/sandbox-generate-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim() }),
      })
      const data = await res.json() as GenerateBriefResult & { error?: string }
      if (!res.ok) {
        setError('Something went wrong building your brief. Try again — it usually works on the second attempt.')
        setBriefLoading(false)
        return
      }
      setBrief({
        title: data.title, objective: data.objective, audience: data.audience,
        platforms: data.platforms as string[], duration: data.duration,
        tone: (data.tone ?? 'cinematic') as BriefNodeData['tone'],
        keyFacts: data.keyFacts, additionalNotes: data.additionalNotes, status: 'approved',
      })
      setStep('skill')
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setBriefLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!brief) return
    setError('')
    setStep('generating')
    try {
      const res = await fetch('/api/sandbox-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, skill, skillMarkdown: '', existingContent: {} }),
      })
      const data = await res.json() as GenerationPlan & { error?: string }
      if (!res.ok) {
        setError('Generation hit a snag. Hit "Try again" — it usually clears up immediately.')
        setStep('skill')
        return
      }
      setPlan(data)
      setStep('result')
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
      setStep('skill')
    }
  }

  // Sort stages in a readable order
  const sortedStages = plan?.stages.slice().sort((a, b) => {
    const ai = KIND_ORDER.indexOf(a.kind)
    const bi = KIND_ORDER.indexOf(b.kind)
    if (ai !== bi) return ai - bi
    return (a.index ?? 0) - (b.index ?? 0)
  }) ?? []

  const exportPdf = async () => {
    if (!plan || !brief) return
    const stages = sortedStages.map((s) => ({
      label: KIND_LABEL[s.kind] ?? s.label,
      index: s.index,
      content: s.content,
      kind: s.kind,
    }))
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'pdf',
          title: brief.title || 'Script',
          objective: brief.objective,
          audience: brief.audience,
          duration: brief.duration,
          tone: brief.tone,
          stages,
          filename: (brief.title || 'script').toLowerCase().replace(/\s+/g, '-'),
        }),
      })
      if (!res.ok) return
      const html = await res.text()
      const win = window.open('', '_blank')
      if (win) { win.document.write(html); win.document.close() }
    } catch { /* silent */ }
  }

  const reset = () => {
    setStep('idea'); setIdea(''); setBrief(null); setPlan(null); setError('')
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6" aria-label="Wizard steps">
        {(['idea', 'skill', 'result'] as const).map((s, i) => {
          const done = (step === 'skill' && s === 'idea') ||
            ((step === 'generating' || step === 'result') && (s === 'idea' || s === 'skill'))
          const active = step === s || (step === 'generating' && s === 'result')
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'flex size-6 items-center justify-center rounded-full text-[10px] font-medium transition-all',
                done ? 'bg-primary text-primary-foreground' :
                active ? 'border border-primary text-primary bg-primary/10' :
                'border border-white/[0.15] text-muted-foreground',
              )}>
                {done ? <Check className="size-3" /> : i + 1}
              </div>
              <span className={cn('text-[11px]', active ? 'text-foreground' : 'text-muted-foreground')}>
                {s === 'idea' ? 'Your idea' : s === 'skill' ? 'Choose style' : 'Script'}
              </span>
              {i < 2 && <span className="text-white/20 mx-1">—</span>}
            </div>
          )
        })}
      </div>

      {/* Step 1 — Idea */}
      {step === 'idea' && (
        <div className="rounded-2xl border border-white/[0.09] bg-black/30 p-5 backdrop-blur-sm">
          <h2 className="text-[15px] font-medium mb-1">Describe your film or video idea</h2>
          <p className="text-[12px] text-muted-foreground mb-4">
            One sentence or a paragraph — the AI builds the brief for you.
          </p>
          <textarea
            autoFocus
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void handleIdeaNext() }}
            placeholder="e.g. A 60-second brand film for a luxury watch company launching their first smartwatch. Cinematic tone, wealthy professionals audience, no voiceover."
            rows={4}
            className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3.5 py-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 resize-none"
          />
          <p className="text-[10px] text-muted-foreground/50 mt-1">⌘ Enter to continue</p>
          {error && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-warning/25 bg-warning/8 px-3.5 py-2.5">
              <p className="text-[11.5px] text-foreground/80 leading-snug">{error}</p>
              <button
                type="button"
                onClick={() => void handleIdeaNext()}
                disabled={briefLoading}
                className="shrink-0 rounded-lg bg-primary/15 px-3 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/25 transition-colors disabled:opacity-50"
              >
                Try again
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => void handleIdeaNext()}
            disabled={!idea.trim() || briefLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {briefLoading
              ? <><Loader2 className="size-4 animate-spin" />Building brief…</>
              : <><Sparkles className="size-4" />Build brief &amp; continue<ArrowRight className="size-3.5" /></>
            }
          </button>
        </div>
      )}

      {/* Step 2 — Skill */}
      {step === 'skill' && brief && (
        <div className="rounded-2xl border border-white/[0.09] bg-black/30 p-5 backdrop-blur-sm space-y-4">
          {/* Brief preview */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 space-y-1">
            <p className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.1em]">Brief</p>
            <p className="text-[13.5px] font-medium">{brief.title}</p>
            <p className="text-[11.5px] text-muted-foreground leading-snug">{brief.objective}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {brief.duration && <Chip>{brief.duration}</Chip>}
              {brief.tone && <Chip>{brief.tone}</Chip>}
              {(brief.platforms ?? []).slice(0, 2).map((p) => <Chip key={p}>{p}</Chip>)}
            </div>
          </div>

          <div>
            <h2 className="text-[14px] font-medium mb-3">Choose a script style</h2>
            <div className="flex flex-col gap-2">
              {SKILL_OPTIONS.map(({ id, name, tagline, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSkill(id)}
                  aria-pressed={skill === id}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all',
                    skill === id
                      ? 'border-primary/45 bg-primary/[0.07]'
                      : 'border-white/[0.08] bg-black/20 hover:border-white/[0.16]',
                  )}
                >
                  <Icon className={cn('size-4 mt-0.5 shrink-0', skill === id ? 'text-primary' : 'text-muted-foreground')} />
                  <div>
                    <p className={cn('text-[13px] font-medium', skill === id ? 'text-foreground' : 'text-foreground/85')}>{name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{tagline}</p>
                  </div>
                  <div className={cn(
                    'ml-auto mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                    skill === id ? 'border-primary bg-primary' : 'border-white/20',
                  )}>
                    {skill === id && <Check className="size-2.5 text-primary-foreground" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-warning/25 bg-warning/8 px-3.5 py-2.5">
              <p className="text-[11.5px] text-foreground/80 leading-snug">{error}</p>
              <button
                type="button"
                onClick={() => void handleGenerate()}
                className="shrink-0 rounded-lg bg-primary/15 px-3 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/25 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={reset} className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-[12px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground">
              Back
            </button>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[13px] font-medium text-primary-foreground hover:opacity-90"
            >
              <Sparkles className="size-4" />
              Generate script
            </button>
          </div>
        </div>
      )}

      {/* Generating */}
      {step === 'generating' && (
        <div className="rounded-2xl border border-white/[0.09] bg-black/30 p-8 flex flex-col items-center gap-4 backdrop-blur-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15">
            <Loader2 className="size-6 text-primary animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-[14px] font-medium">Generating your script…</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              {skill === 'auteur' ? 'Building 5 Auteur stages' : 'Building hook, scenes, dialogue & CTA'}
            </p>
          </div>
          <div className="w-full max-w-xs rounded-full bg-white/[0.06] overflow-hidden h-1">
            <div className="h-1 rounded-full bg-primary animate-[width_3s_ease-in-out_infinite] w-1/2" />
          </div>
        </div>
      )}

      {/* Step 3 — Results */}
      {step === 'result' && plan && (
        <div className="rounded-2xl border border-white/[0.09] bg-black/30 backdrop-blur-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.07] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.1em]">Generated script</p>
              <p className="text-[14px] font-medium mt-0.5">{brief?.title}</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary">
              <Check className="size-3" />
              {sortedStages.length} stages
            </span>
          </div>

          <div className="max-h-[420px] overflow-y-auto scroll-slim divide-y divide-white/[0.05]">
            {sortedStages.map((stage) => (
              <div key={stage.stageKey} className="px-5 py-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-primary/70 mb-1.5">
                  {KIND_LABEL[stage.kind] ?? stage.label}
                  {stage.index != null ? ` ${stage.index}` : ''}
                </p>
                <p className="text-[12.5px] text-foreground/85 leading-relaxed whitespace-pre-wrap">{stage.content}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-5 py-4 border-t border-white/[0.07] bg-white/[0.01]">
            <p className="text-[12px] text-muted-foreground mb-3">
              This is a live preview. Sign up to save, edit nodes, lock scenes, run continuity checks, and export.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onSignUp}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-[13px] font-medium text-primary-foreground hover:opacity-90"
              >
                <ArrowRight className="size-4" />
                Save &amp; continue with ChatGPT
              </button>
              <button
                type="button"
                onClick={() => void exportPdf()}
                title="Export as PDF"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.09] px-3 py-2.5 text-[12px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
              >
                <Download className="size-3.5" />
                PDF
              </button>
              <button
                type="button"
                onClick={reset}
                title="Try another idea"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.09] px-3 py-2.5 text-[12px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
              >
                <RefreshCw className="size-3.5" />
                Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-white/[0.08] px-2 py-0.5 text-[10.5px] text-muted-foreground">
      {children}
    </span>
  )
}
