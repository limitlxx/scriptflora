'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle, Check, ChevronDown, ChevronUp,
  Loader2, Plus, Save, Sparkles, Trash2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getStudioSkill, saveStudioSkill, bumpVersion,
  FAMILY_LABELS, FAMILY_DESCRIPTIONS, ALL_PERMISSIONS,
  type StudioSkill, type SkillFamily,
} from '@/lib/skill-studio'
import { CORE_NODE_TYPES, type SkillPermission, type SkillNodeRecipe } from '@/lib/flow-types'
import type { TestRunResponse } from '@/app/api/skills/test-run/route'
import type { GeneratedStage } from '@/lib/flow-types'

const TABS = ['Manifest', 'Instructions', 'Recipe', 'Test run', 'Version'] as const
type Tab = (typeof TABS)[number]

// ── Reusable field primitives ──────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{children}</span>
}

const fieldCls = cn(
  'w-full rounded-lg border border-white/[0.08] bg-black/25 px-2.5 py-2',
  'text-[12px] leading-relaxed text-foreground placeholder:text-muted-foreground/50',
  'outline-none transition-colors hover:border-white/[0.13] focus:border-primary/45',
)

// ── Node kinds available for recipes ──────────────────────────────
const SKILL_NODE_KINDS = [
  'hook', 'scene', 'dialogue', 'visual', 'cta',
  'auteur-stageplay', 'auteur-screenplay', 'auteur-technical',
  'auteur-production-summary', 'auteur-script',
]

// ── Main component ──────────────────────────────────────────────
export function SkillEditorClient({ skillId }: { skillId: string }) {
  const router = useRouter()
  const [skill, setSkill] = useState<StudioSkill | null>(null)
  const [tab, setTab] = useState<Tab>('Manifest')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Test run state
  const [testBrief, setTestBrief] = useState({ title: 'Test project', objective: 'Test the skill', audience: 'Developers', duration: '60s', tone: 'conversational', keyFacts: [] as string[] })
  const [testRunning, setTestRunning] = useState(false)
  const [testResult, setTestResult] = useState<TestRunResponse | null>(null)
  const [testError, setTestError] = useState('')

  useEffect(() => {
    const s = getStudioSkill(skillId)
    if (!s) { router.replace('/skills'); return }
    setSkill(s)
  }, [skillId, router])

  if (!skill) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )

  // ── Helpers ──────────────────────────────────────────────────────
  const update = (patch: Partial<StudioSkill>) => setSkill((s) => s ? { ...s, ...patch } : s)
  const updateManifest = (patch: Partial<StudioSkill['manifest']>) =>
    update({ manifest: { ...skill.manifest, ...patch } })

  const handleSave = () => {
    setSaving(true)
    saveStudioSkill(skill)
    setSaved(true)
    setSaving(false)
    window.setTimeout(() => setSaved(false), 2000)
  }

  const togglePermission = (perm: SkillPermission) => {
    const current = skill.manifest.permissions
    const next = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm]
    updateManifest({ permissions: next })
  }

  // ── Recipe helpers ───────────────────────────────────────────────
  const addRecipeNode = () => {
    const n: SkillNodeRecipe = { key: `node-${skill.manifest.nodes.length + 1}`, type: 'content', kind: 'scene' as const }
    updateManifest({ nodes: [...skill.manifest.nodes, n] })
  }

  const updateRecipeNode = (idx: number, patch: Partial<SkillNodeRecipe>) => {
    const nodes = skill.manifest.nodes.map((n, i) => i === idx ? { ...n, ...patch } : n)
    updateManifest({ nodes })
  }

  const removeRecipeNode = (idx: number) =>
    updateManifest({ nodes: skill.manifest.nodes.filter((_, i) => i !== idx) })

  // ── Test run ─────────────────────────────────────────────────────
  const handleTestRun = async () => {
    setTestRunning(true)
    setTestError('')
    setTestResult(null)

    try {
      const res = await fetch('/api/skills/test-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions: skill.instructions,
          nodes: skill.manifest.nodes,
          brief: testBrief,
          skillId: skill.manifest.skillId,
          skillVersion: skill.manifest.version,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        setTestError(body.error ?? 'Test run failed.')
        return
      }

      const result = await res.json() as TestRunResponse
      setTestResult(result)
      // Mark as tested
      const tested = { ...skill, testedAt: result.executedAt }
      setSkill(tested)
      saveStudioSkill(tested)
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Test run failed.')
    } finally {
      setTestRunning(false)
    }
  }

  // ── Version bump ─────────────────────────────────────────────────
  const handleBump = (bump: 'patch' | 'minor' | 'major') => {
    const next = bumpVersion(skill.manifest.version, bump)
    updateManifest({ version: next, changelog: skill.changelogDraft || `v${next}` })
    update({ changelogDraft: '' })
  }

  const handlePublish = () => {
    const published = { ...skill, status: 'published' as const }
    setSkill(published)
    saveStudioSkill(published)
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-10">
      {/* Title + save */}
      <div className="mb-6 flex items-center gap-3">
        <input
          value={skill.manifest.name}
          onChange={(e) => updateManifest({ name: e.target.value })}
          placeholder="Skill name"
          className="min-w-0 flex-1 bg-transparent text-[20px] font-medium tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
        />
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
          skill.status === 'published' ? 'text-success bg-success/10' :
          skill.status === 'archived'  ? 'text-muted-foreground/50 bg-white/[0.05]' :
                                          'text-muted-foreground bg-white/[0.06]')}>
          {skill.status}
        </span>
        <button type="button" onClick={handleSave} disabled={saving}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all disabled:opacity-50',
            saved ? 'bg-success/15 text-success' : 'bg-primary text-primary-foreground hover:opacity-90',
          )}>
          {saved ? <><Check className="size-3.5" />Saved</> : <><Save className="size-3.5" />Save</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-0.5 overflow-x-auto rounded-xl border border-white/[0.07] bg-black/20 p-1">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={cn(
              'rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap',
              tab === t ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground',
            )}>
            {t}
            {t === 'Test run' && skill.testedAt && (
              <span className="ml-1.5 inline-block size-1.5 rounded-full bg-success/70 align-middle" />
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Manifest ── */}
      {tab === 'Manifest' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <FieldLabel>Skill ID</FieldLabel>
              <input value={skill.manifest.skillId} onChange={(e) => updateManifest({ skillId: e.target.value })}
                placeholder="publisher.skill-slug" className={fieldCls} />
            </label>
            <label className="block">
              <FieldLabel>Publisher ID</FieldLabel>
              <input value={skill.manifest.publisherId} onChange={(e) => updateManifest({ publisherId: e.target.value })}
                placeholder="your-name" className={fieldCls} />
            </label>
          </div>

          <label className="block">
            <FieldLabel>Tagline</FieldLabel>
            <input value={skill.manifest.tagline} onChange={(e) => updateManifest({ tagline: e.target.value })}
              placeholder="One sentence: what this skill does and who should use it" className={fieldCls} />
          </label>

          {/* Family */}
          <div>
            <FieldLabel>Skill family</FieldLabel>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(['script', 'style', 'structure', 'packaging', 'domain'] as SkillFamily[]).map((f) => (
                <button key={f} type="button" onClick={() => update({ family: f })}
                  aria-pressed={skill.family === f}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-all',
                    skill.family === f ? 'border-primary/45 bg-accent-muted' : 'border-white/[0.07] bg-black/20 hover:border-white/[0.14]',
                  )}>
                  <p className={cn('text-[12px] font-medium', skill.family === f ? 'text-foreground' : 'text-foreground/80')}>
                    {FAMILY_LABELS[f]}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground/60">{FAMILY_DESCRIPTIONS[f]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Requires */}
          <div className="space-y-2">
            <FieldLabel>Requirements</FieldLabel>
            <div className="space-y-1.5">
              {[
                ['briefConfirmed', 'Brief must be confirmed before running'],
              ].map(([key, label]) => (
                <button key={key} type="button"
                  onClick={() => updateManifest({ requires: { ...skill.manifest.requires, [key]: !(skill.manifest.requires as Record<string, unknown>)[key] } })}
                  className="flex items-center gap-2 text-left">
                  <span className={cn('flex size-3.5 items-center justify-center rounded border transition-all',
                    (skill.manifest.requires as Record<string, unknown>)[key] ? 'border-primary bg-primary' : 'border-white/20')}>
                    {(skill.manifest.requires as Record<string, unknown>)[key] && <Check className="size-2.5 text-primary-foreground" />}
                  </span>
                  <span className="text-[11.5px] text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <FieldLabel>Permissions</FieldLabel>
            <div className="space-y-1.5">
              {ALL_PERMISSIONS.map((p) => {
                const active = skill.manifest.permissions.includes(p.id)
                return (
                  <button key={p.id} type="button" onClick={() => togglePermission(p.id)}
                    className="flex w-full items-center gap-3 rounded-lg border border-white/[0.06] bg-black/10 px-3 py-2 text-left transition-colors hover:bg-white/[0.03]">
                    <span className={cn('flex size-3.5 shrink-0 items-center justify-center rounded border transition-all',
                      active ? 'border-primary bg-primary' : 'border-white/20')}>
                      {active && <Check className="size-2.5 text-primary-foreground" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10.5px] text-foreground/80">{p.id}</span>
                      <span className="ml-3 text-[10.5px] text-muted-foreground/60">{p.desc}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Instructions ── */}
      {tab === 'Instructions' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-[12.5px] text-muted-foreground">
            <strong className="text-foreground">Director instructions</strong> — This is the system prompt the skill injects before generation.
            Tell the model how to interpret the brief, what style to follow, and what the stages should achieve.
            Key facts from the Brief are always injected automatically.
          </div>
          <textarea
            value={skill.instructions}
            onChange={(e) => update({ instructions: e.target.value })}
            placeholder={`You are a professional scriptwriter executing the ${skill.manifest.name ?? 'skill'} pipeline.\n\nFor each stage:\n- [Describe what this stage should produce]\n\nRules:\n- Always respect the Brief\n- [Add your specific rules here]`}
            rows={18}
            className={cn(fieldCls, 'resize-y font-mono text-[11.5px] leading-relaxed')}
          />
          <p className="text-[10.5px] text-muted-foreground/50">
            {skill.instructions.trim().split(/\s+/).filter(Boolean).length} words
          </p>
        </div>
      )}

      {/* ── TAB: Recipe ── */}
      {tab === 'Recipe' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-[11.5px] text-muted-foreground">
            Core system nodes ({Array.from(CORE_NODE_TYPES).join(', ')}) cannot be in a skill recipe.
            Use <span className="font-mono text-foreground/70">content</span> nodes only.
          </div>

          <div className="space-y-2">
            {skill.manifest.nodes.map((node, i) => (
              <RecipeNodeRow key={i} node={node} index={i}
                onUpdate={(patch) => updateRecipeNode(i, patch)}
                onRemove={() => removeRecipeNode(i)} />
            ))}
            {skill.manifest.nodes.length === 0 && (
              <p className="py-4 text-center text-[11.5px] text-muted-foreground/60">
                No nodes yet — add the first stage below.
              </p>
            )}
          </div>

          <button type="button" onClick={addRecipeNode}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.12] py-2.5 text-[12px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
            <Plus className="size-3.5" />
            Add stage
          </button>
        </div>
      )}

      {/* ── TAB: Test run ── */}
      {tab === 'Test run' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-[12.5px] text-muted-foreground">
            Test runs are <strong className="text-foreground">isolated</strong>. Outputs are marked <code className="rounded bg-white/[0.06] px-1 text-[10.5px]">origin: test</code> and never written to any real project or Continuity Log.
          </div>

          {/* Test brief */}
          <div className="space-y-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">Test brief</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <FieldLabel>Title</FieldLabel>
                <input value={testBrief.title} onChange={(e) => setTestBrief((b) => ({ ...b, title: e.target.value }))} className={fieldCls} />
              </label>
              <label className="block">
                <FieldLabel>Duration</FieldLabel>
                <input value={testBrief.duration} onChange={(e) => setTestBrief((b) => ({ ...b, duration: e.target.value }))} placeholder="60s" className={fieldCls} />
              </label>
            </div>
            <label className="block">
              <FieldLabel>Objective</FieldLabel>
              <input value={testBrief.objective} onChange={(e) => setTestBrief((b) => ({ ...b, objective: e.target.value }))} className={fieldCls} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <FieldLabel>Audience</FieldLabel>
                <input value={testBrief.audience} onChange={(e) => setTestBrief((b) => ({ ...b, audience: e.target.value }))} className={fieldCls} />
              </label>
              <label className="block">
                <FieldLabel>Tone</FieldLabel>
                <input value={testBrief.tone} onChange={(e) => setTestBrief((b) => ({ ...b, tone: e.target.value }))} placeholder="cinematic" className={fieldCls} />
              </label>
            </div>
          </div>

          <button type="button" onClick={() => void handleTestRun()} disabled={testRunning || !skill.instructions.trim()}
            className={cn(
              'flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-medium transition-all disabled:opacity-50 disabled:pointer-events-none',
              testRunning ? 'bg-primary/15 text-primary' : 'bg-primary text-primary-foreground hover:opacity-90',
            )}>
            {testRunning ? <><Loader2 className="size-4 animate-spin" />Running test…</> : <><Sparkles className="size-4" />Run test</>}
          </button>

          {testError && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
              <p className="text-[11.5px] text-destructive/90">{testError}</p>
            </div>
          )}

          {testResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-success">
                <Check className="size-3.5" />
                Test passed — {testResult.plan.stages.length} stage{testResult.plan.stages.length !== 1 ? 's' : ''} generated · origin: test · {new Date(testResult.executedAt).toLocaleTimeString()}
              </div>
              <div className="space-y-2">
                {testResult.plan.stages.map((stage: GeneratedStage, i: number) => (
                  <div key={i} className="rounded-xl border border-white/[0.07] bg-black/20 p-3.5">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="font-mono text-[10px] text-primary/70">{stage.stageKey}</span>
                      <span className="text-[10px] text-muted-foreground/50">origin: test</span>
                    </div>
                    <p className="text-[12px] font-medium text-foreground/90">{stage.label}</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-[11.5px] leading-relaxed text-muted-foreground">{stage.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Version ── */}
      {tab === 'Version' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
            <p className="mb-1 text-[12.5px] font-medium text-foreground">Current version</p>
            <p className="font-mono text-[24px] font-medium text-primary">{skill.manifest.version}</p>
            <p className="mt-1 text-[11px] text-muted-foreground/60">
              {skill.manifest.changelog || 'No changelog yet.'}
            </p>
          </div>

          <label className="block">
            <FieldLabel>Changelog for next version</FieldLabel>
            <textarea value={skill.changelogDraft}
              onChange={(e) => update({ changelogDraft: e.target.value })}
              placeholder="What changed in this version?"
              rows={3} className={cn(fieldCls, 'resize-none')} />
          </label>

          <div>
            <FieldLabel>Bump version</FieldLabel>
            <div className="flex gap-2">
              {(['patch', 'minor', 'major'] as const).map((bump) => {
                const preview = bumpVersion(skill.manifest.version, bump)
                return (
                  <button key={bump} type="button" onClick={() => handleBump(bump)}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-black/20 py-2.5 text-center transition-all hover:border-primary/35 hover:bg-accent-muted">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{bump}</p>
                    <p className="mt-0.5 font-mono text-[14px] text-foreground">{preview}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {!skill.testedAt && (
            <div className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/8 p-3">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-warning" />
              <p className="text-[11.5px] text-warning/90">
                Skill has not been test-run yet. Run the test before publishing.
              </p>
            </div>
          )}

          <button type="button" onClick={handlePublish}
            disabled={!skill.testedAt || skill.status === 'published'}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-success/15 py-2.5 text-[12px] font-medium text-success hover:bg-success/25 border border-success/20 disabled:opacity-40 disabled:pointer-events-none transition-all">
            <Check className="size-4" />
            {skill.status === 'published' ? 'Already published' : 'Publish this version'}
          </button>
          <p className="text-center text-[10.5px] text-muted-foreground/50">
            Published versions are immutable. Bump the version to make changes.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Recipe node row ─────────────────────────────────────────────
function RecipeNodeRow({
  node, index, onUpdate, onRemove,
}: {
  node: SkillNodeRecipe
  index: number
  onUpdate: (patch: Partial<SkillNodeRecipe>) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-[10px] text-primary">{index + 1}</span>
        <input value={node.key} onChange={(e) => onUpdate({ key: e.target.value })}
          placeholder="stage-key" className="min-w-0 flex-1 bg-transparent font-mono text-[11.5px] text-foreground/90 outline-none" />
        <select value={node.kind ?? 'scene'}
          onChange={(e) => onUpdate({ kind: e.target.value as SkillNodeRecipe['kind'] })}
          className="rounded-md border border-white/[0.07] bg-black/25 px-2 py-1 text-[11px] text-foreground/80 outline-none">
          {SKILL_NODE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-muted-foreground hover:text-foreground">
          {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        <button type="button" onClick={onRemove} className="text-muted-foreground/30 hover:text-destructive">
          <Trash2 className="size-3" />
        </button>
      </div>
      {open && (
        <div className="space-y-2 border-t border-white/[0.06] px-3 pb-3 pt-2.5">
          <label className="block">
            <span className="mb-1 block text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Title (displayed on node)</span>
            <input value={node.title ?? ''} onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Stage title" className="w-full rounded-lg border border-white/[0.07] bg-black/20 px-2.5 py-1.5 text-[11.5px] text-foreground/90 outline-none" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Depends on (comma-separated keys)</span>
            <input value={(node.dependsOn ?? []).join(', ')}
              onChange={(e) => onUpdate({ dependsOn: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              placeholder="e.g. hook, scene" className="w-full rounded-lg border border-white/[0.07] bg-black/20 px-2.5 py-1.5 text-[11.5px] font-mono text-foreground/90 outline-none" />
          </label>
        </div>
      )}
    </div>
  )
}
