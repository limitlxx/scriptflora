import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowDown,
  ArrowLeft,
  BookMarked,
  BookOpen,
  Camera,
  Check,
  Clapperboard,
  Film,
  FileText,
  Flag,
  FolderKanban,
  Gauge,
  Globe,
  Image as ImageIcon,
  LayoutGrid,
  Layers,
  Lock,
  MessageCircle,
  MessageSquare,
  Milestone,
  ArrowDownToLine,
  Package,
  Play,
  RefreshCw,
  Scissors,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Tv,
  Users,
  Video,
  WandSparkles,
  Eye,
  Zap,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Docs — ScriptFlora',
  description: 'Complete guide to using ScriptFlora — from first brief to finished film package.',
}

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-1 text-xl font-medium tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="mb-4 text-[12.5px] text-primary/80">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  )
}

function NodeCard({
  icon: Icon,
  name,
  phase,
  color = 'text-muted-foreground',
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  name: string
  phase?: string
  color?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg border border-white/[0.08] bg-black/30">
            <Icon className={`size-3.5 ${color}`} />
          </span>
          <span className="text-[13px] font-medium text-foreground">{name}</span>
        </div>
        {phase && (
          <span className="rounded-full border border-white/[0.06] px-2 py-0.5 text-[9.5px] font-medium text-muted-foreground/60">
            Phase {phase}
          </span>
        )}
      </div>
      <div className="space-y-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-white/[0.08] bg-black/20 px-2 py-0.5 font-mono text-[10.5px] text-foreground/75">
      {children}
    </span>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-mono text-[11px] font-medium text-primary">
        {n}
      </div>
      <div className="pt-0.5">
        <p className="mb-1 text-[13px] font-medium text-foreground">{title}</p>
        <div className="text-[12.5px] leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

function Callout({ type = 'info', title, children }: { type?: 'info' | 'warning' | 'tip'; title: string; children: React.ReactNode }) {
  const styles = {
    info: 'border-primary/20 bg-primary/5',
    warning: 'border-warning/20 bg-warning/5',
    tip: 'border-success/20 bg-success/5',
  }
  const titleStyles = {
    info: 'text-primary',
    warning: 'text-warning',
    tip: 'text-success',
  }
  return (
    <div className={`rounded-xl border p-4 ${styles[type]}`}>
      <p className={`mb-1.5 text-[12.5px] font-medium ${titleStyles[type]}`}>{title}</p>
      <div className="text-[12.5px] leading-relaxed text-muted-foreground">{children}</div>
    </div>
  )
}

const NAV = [
  { id: 'quickstart',      label: 'Quick start' },
  { id: 'canvas',          label: 'Canvas basics' },
  { id: 'phase0',          label: 'Phase 0 — Scripts' },
  { id: 'phase1',          label: 'Phase 1 — Continuity' },
  { id: 'phase2',          label: 'Phase 2 — Shot layer' },
  { id: 'phase3',          label: 'Phase 3 — Generate' },
  { id: 'phase4',          label: 'Phase 4 — Assembly' },
  { id: 'phase5',          label: 'Phase 5 — Autopilot' },
  { id: 'phase6',          label: 'Phase 6 — Series' },
  { id: 'phase7',          label: 'Phase 7 — Packs & team' },
  { id: 'all-nodes',       label: 'All nodes' },
  { id: 'skills',          label: 'Skills' },
  { id: 'custom-skills',   label: 'Custom skills' },
  { id: 'shortcuts',       label: 'Shortcuts' },
]

export default function DocsPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-white/[0.06] bg-background/80 px-5 backdrop-blur-xl md:px-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-3.5" />
            ScriptFlora
          </Link>
          <span className="text-white/20">/</span>
          <span className="flex items-center gap-1.5 text-[12px] text-foreground/80">
            <BookOpen className="size-3.5" />
            Documentation
          </span>
        </div>
        <Link href="/projects" className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:opacity-90">
          <Sparkles className="size-3" />
          Open app
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-6xl gap-10 px-5 py-10 md:px-10 md:py-14">
        {/* Sidebar nav */}
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-20">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">Contents</p>
            <nav className="flex flex-col gap-0.5">
              {NAV.map((item) => (
                <a key={item.id} href={`#${item.id}`}
                  className="rounded-lg px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground">
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 space-y-16">
          {/* Hero */}
          <div>
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-primary/80">Documentation</p>
            <h1 className="text-3xl font-medium tracking-tight md:text-4xl">ScriptFlora guide</h1>
            <p className="mt-4 max-w-prose text-[14px] leading-7 text-muted-foreground">
              ScriptFlora is the Director's desk for AI film. Start with a brief, build a structured script, lock character identities, generate shots, assemble a rough cut, and export a handoff package — all under human control at every gate.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Phase 0–1', 'Brief + script + continuity'],
                ['Phase 2–3', 'Shots + video generation'],
                ['Phase 4–5', 'Assembly + autopilot'],
                ['Phase 6–7', 'Series memory + packs'],
              ].map(([phase, desc]) => (
                <div key={phase as string} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
                  <p className="text-[11px] font-medium text-primary">{phase as string}</p>
                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">{desc as string}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── QUICK START ── */}
          <Section id="quickstart" title="Quick start">
            <div className="space-y-5">
              <Step n={1} title="Sign in with ChatGPT">
                Click <strong>Continue with ChatGPT</strong> on the landing page. ScriptFlora uses your own ChatGPT subscription — no separate API key. Tokens never reach the browser.
              </Step>
              <Step n={2} title="Create a project">
                Go to <strong>Projects</strong>, click <strong>New project</strong>, name it, then click <strong>Create &amp; open</strong>. Each project has its own canvas.
              </Step>
              <Step n={3} title="Fill the Brief node">
                Fill Title, Objective, Audience, Duration, Tone, and Key Facts. Key Facts are hard constraints — the model will never contradict them.
              </Step>
              <Step n={4} title="Confirm the Brief">
                Click <strong>Confirm Brief &amp; unlock pipeline</strong>. This is a deliberate gate. If required fields are missing, a red error list appears.
              </Step>
              <Step n={5} title="Select a skill and generate">
                On the Skill node, pick <em>Standard Script</em> or <em>Auteur Script</em>. Click <strong>Generate</strong> in the top bar.
              </Step>
              <Step n={6} title="Review, lock, and export">
                Edit content nodes inline. Lock sections you're happy with (<Pill>L</Pill>). Regenerate weak ones (<Pill>⟳</Pill>). Export via the Export node.
              </Step>
            </div>
          </Section>

          {/* ── CANVAS ── */}
          <Section id="canvas" title="Canvas basics">
            <div className="space-y-3 text-[13px] leading-7 text-muted-foreground">
              <p>The canvas is a free-form <strong className="text-foreground">React Flow</strong> workspace. Nodes can be placed anywhere. Edges carry data left → right.</p>
              <ul className="ml-4 list-disc space-y-1.5">
                <li><strong className="text-foreground">Drag</strong> nodes to reposition them.</li>
                <li><strong className="text-foreground">Drag from a handle</strong> to draw a connection between nodes.</li>
                <li><strong className="text-foreground">Double-click empty canvas</strong> to open the Add Node menu.</li>
                <li><strong className="text-foreground">Drag from the sidebar</strong> to drop a node at a precise position.</li>
                <li><strong className="text-foreground">Minimap</strong> (bottom right) — drag to navigate large graphs.</li>
                <li>The canvas <strong className="text-foreground">autosaves</strong> to your browser on every change.</li>
                <li><strong className="text-foreground">Project name</strong> is editable in the top bar.</li>
              </ul>
            </div>
          </Section>

          {/* ── PHASE 0 ── */}
          <Section id="phase0" title="Phase 0 — Brief, scripts, and export" subtitle="The core loop. Everything else builds on this.">
            <div className="space-y-6">
              <div className="space-y-4 text-[13px] leading-7 text-muted-foreground">
                <p>The golden path: Brief → Skill → Generate → Review → Export.</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-[13.5px] font-medium text-foreground">Brief node</h3>
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">Fill all fields you can. The more context, the better the output.</p>
                <ul className="ml-4 list-disc space-y-1 text-[12.5px] text-muted-foreground">
                  <li><strong className="text-foreground">Key Facts</strong> — hard constraints. Add each and press Enter. Never contradicted by the model.</li>
                  <li><strong className="text-foreground">Confirm Brief</strong> — required before generation. Shows validation errors for missing required fields (Title, Objective, Duration).</li>
                  <li><strong className="text-foreground">Generate Brief from idea</strong> — describe your idea in plain text, AI fills the form. Inferred fields are flagged amber.</li>
                  <li><strong className="text-foreground">Improve Brief</strong> — fills empty fields without overwriting what you've written.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-[13.5px] font-medium text-foreground">Skills</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <p className="mb-2 text-[12.5px] font-medium text-foreground">Standard Script</p>
                    <p className="text-[12px] text-muted-foreground">Hook → Scenes → Dialogue → Visual Directions → CTA. Best for ads, training, social content.</p>
                    <p className="mt-2 text-[11px] text-muted-foreground/60">N scenes scales with duration: 15s→2, 60s→4, 90s+→6</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <p className="mb-2 text-[12.5px] font-medium text-foreground">Auteur Script</p>
                    <p className="text-[12px] text-muted-foreground">5-stage Frequency Over Force funnel. Designed for generative video continuity. Follow stages in strict order.</p>
                    <p className="mt-2 text-[11px] text-muted-foreground/60">Stageplay → Screenplay → Technical → Production Summary → Auteur Script</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[13.5px] font-medium text-foreground">Individual node regeneration</h3>
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">Click ⟳ on any content node to regenerate just that stage. It always receives the full Brief, upstream locked content, and your key facts.</p>
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">Use the <strong className="text-foreground">Prompt</strong> accordion on any node to add specific instructions before regenerating ("make this funnier", "cut to 30 words").</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-[13.5px] font-medium text-foreground">Continuity checker</h3>
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">Add a Continuity Checker node. Click <strong className="text-foreground">Run check</strong>. It reads all canvas content plus the full Brief context (tone, audience, platform) and returns a 0–100 score with issues ranked by severity.</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-[13.5px] font-medium text-foreground">Export</h3>
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">The Export node downloads the full script as Markdown. The Multi-Format Output node generates separate files: Screenplay, Shot list, Voiceover script, Social cutdowns, Beat sheet.</p>
              </div>
            </div>
          </Section>

          {/* ── PHASE 1 ── */}
          <Section id="phase1" title="Phase 1 — Character Bible, Style Lock, Continuity Log" subtitle="Set up identity and visual memory before generating any script or media.">
            <div className="space-y-6">
              <Callout type="warning" title="Do this before generating">
                Build the Character Bible and lock the Style Lock before running any skill. These are injected into every generation automatically once locked.
              </Callout>

              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Character Bible node</h3>
                <div className="space-y-3 text-[12.5px] leading-relaxed text-muted-foreground">
                  <p>Add from sidebar → <strong className="text-foreground">Character Bible</strong>. For each character:</p>
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Click <strong className="text-foreground">Add character</strong>.</li>
                    <li>Fill name, role, goals, traits, visual description, wardrobe.</li>
                    <li>Expand <strong className="text-foreground">Voice profile</strong> — fill voice ID, tone, style. This is used for TTS in Phase 3.</li>
                    <li>Upload a reference image. The <span className="text-warning/90">Required before video</span> badge disappears when an image is present.</li>
                    <li>Click the <strong className="text-foreground">Lock</strong> icon on the character card. Locked characters gate video generation — a character without a locked image cannot be generated in Phase 3.</li>
                  </ol>
                  <p>Click <strong className="text-foreground">Sync from Bible</strong> on other nodes to pull locked character lists automatically.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">World / Style Lock node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <p>Add from sidebar → <strong className="text-foreground">World / Style Lock</strong>.</p>
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Select medium: live-action / animation / hybrid.</li>
                    <li>Fill visual rules (color palette, era, grain, lens), locations, and hard constraints.</li>
                    <li>When complete, click <strong className="text-foreground">Lock style rules — inject into all generations</strong>. This sets status to Approved.</li>
                  </ol>
                  <p>Once locked, every generation call receives a <code className="rounded bg-white/[0.06] px-1 text-[10.5px]">STYLE LOCK</code> section with your rules in the prompt.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Continuity Log node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <p>Add from sidebar → <strong className="text-foreground">Continuity Log</strong>. After approving each scene:</p>
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Click <strong className="text-foreground">Add scene entry</strong>.</li>
                    <li>Fill character entry/exit states, revealed facts, open threads, wardrobe changes.</li>
                  </ol>
                  <p>This log is read by the Continuity Checker and injected into downstream generations.</p>
                </div>
              </div>

              <Callout type="info" title="How injection works">
                When you click Generate, the canvas collects all locked Character Bible entries and the locked Style Lock. These are appended to the generation prompt under clear section headers so the model enforces them on every scene.
              </Callout>
            </div>
          </Section>

          {/* ── PHASE 2 ── */}
          <Section id="phase2" title="Phase 2 — Shot List, Storyboard, Sequence" subtitle="Turn an approved script into generation-ready shot briefs.">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Shot List node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <p>Add from sidebar → <strong className="text-foreground">Shot List</strong>.</p>
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Make sure you have at least one approved/draft content node on the canvas.</li>
                    <li>Click <strong className="text-foreground">Expand scene into shots</strong>. ChatGPT breaks the scene into individual shots — each with camera position, action, dialogue lines, continuity notes, opening state, ending state, and duration target.</li>
                    <li>Expand each shot card to review the full brief.</li>
                    <li>Click ✓ to approve a shot, ✗ to reject it.</li>
                    <li>Click <strong className="text-foreground">Re-expand from script</strong> to refresh after editing your script.</li>
                  </ol>
                  <p>Shots automatically inherit locked character refs and the Style Lock version.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Storyboard Frame node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <p>One node per key shot. Add from sidebar → <strong className="text-foreground">Storyboard Frame</strong>.</p>
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Set the shot label to match your Shot List.</li>
                    <li>Upload a reference image (sketch, photo, AI-generated still).</li>
                    <li>Add director notes about framing, mood, or generation references.</li>
                    <li>Click <strong className="text-foreground">Approve frame</strong> — the frame locks and becomes a video generation reference in Phase 3.</li>
                  </ol>
                  <p>Prioritise storyboards for: establishing shots, character introductions, key emotional beats.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Sequence node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <p>Ordered shot skeleton — no media yet. Add from sidebar → <strong className="text-foreground">Sequence</strong>.</p>
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Click <strong className="text-foreground">Sync from Shot Lists</strong> — pulls all shots from every Shot List node on the canvas.</li>
                    <li>Use ▲/▼ arrows to reorder shots.</li>
                    <li>Status dots show shot state: grey (pending) → blue (brief ready) → green (approved).</li>
                  </ol>
                  <p>This becomes the assembly order for the Timeline in Phase 4.</p>
                </div>
              </div>
            </div>
          </Section>

          {/* ── PHASE 3 ── */}
          <Section id="phase3" title="Phase 3 — Generate Shot, Result, Checkpoint" subtitle="Execute shots with the Runway model router under Director control.">
            <div className="space-y-6">
              <Callout type="tip" title="Setup">
                Add your Runway API key to <Pill>.env.local</Pill>: <code className="text-[10.5px]">RUNWAY_API_KEY=your-key</code>. Without it, Generate Shot returns a <strong>simulated result</strong> so the full UI works during development without credits.
              </Callout>

              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Model router logic</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-white/[0.07] text-left text-[10.5px] text-muted-foreground/60">
                        <th className="pb-2 pr-4 font-medium">Shot type / flag</th>
                        <th className="pb-2 pr-4 font-medium">Routes to</th>
                        <th className="pb-2 font-medium">Why</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-muted-foreground">
                      {[
                        ['Edit existing clip', 'Aleph 2.0', 'Video-to-video edit, no full regen'],
                        ['Priority: Draft', 'Gen-4 Turbo', 'Fast and cheap for brief testing'],
                        ['Performance / acting shot', 'Act-Two', 'Transfers expression onto character ref'],
                        ['Native audio required', 'Veo 3.1', 'Strong cinematic + audio path'],
                        ['Default', 'Gen-4.5', 'Flagship quality'],
                      ].map(([flag, model, why]) => (
                        <tr key={flag as string}>
                          <td className="py-2 pr-4">{flag as string}</td>
                          <td className="py-2 pr-4 font-mono text-[10.5px] text-primary/80">{model as string}</td>
                          <td className="py-2">{why as string}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Generate Shot node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Set <strong className="text-foreground">Priority</strong>: Draft / Balanced / Final.</li>
                    <li>Check shot-type flags if applicable (edit, performance, native audio).</li>
                    <li>The <strong className="text-foreground">Routed to</strong> preview shows which Runway model will be used — before you spend any credits.</li>
                    <li><strong className="text-foreground">Estimated cost</strong> shows credits before you generate.</li>
                    <li>Click <strong className="text-foreground">Generate shot</strong>. Locked character images and style lock are passed automatically.</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Result node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <p>Holds the generated clip, dialogue audio, and full provenance.</p>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>Click <strong className="text-foreground">Approve</strong> to mark the clip approved. Approved clips flow into the Timeline.</li>
                    <li>Click <strong className="text-foreground">Reject</strong> and optionally fill a rejection reason — this context is used when you regenerate.</li>
                    <li>Expand <strong className="text-foreground">Generation provenance</strong> to see model, cost, style lock version, timestamp, and character refs used.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Checkpoint node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <p>Human gate — the next batch cannot run until this gate opens.</p>
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Set <strong className="text-foreground">Required approvals</strong> — how many Result nodes must be approved.</li>
                    <li>Click <strong className="text-foreground">Sync approvals from canvas</strong> — counts approved Results automatically.</li>
                    <li>When the threshold is met, the gate opens. Or click <strong className="text-foreground">Open manually</strong> to override.</li>
                    <li>Add <strong className="text-foreground">Director notes for next batch</strong> before continuing.</li>
                  </ol>
                </div>
              </div>
            </div>
          </Section>

          {/* ── PHASE 4 ── */}
          <Section id="phase4" title="Phase 4 — Timeline and Export Package" subtitle="Assemble approved clips into a rough cut and hand off to an editor.">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Timeline node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Add from sidebar → <strong className="text-foreground">Timeline</strong>.</li>
                    <li>Click <strong className="text-foreground">Sync approved results</strong> — reads all approved Result nodes, extracts video/audio URLs, labels, and durations.</li>
                    <li>Click ▶ to preview the rough cut. The player advances through clips automatically.</li>
                    <li>Use ▲/▼ to reorder clips.</li>
                    <li>Toggle <strong className="text-foreground">Cut / Fade</strong> between clips to set transition type.</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Export Package node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Set a package name (e.g. <Pill>aperture-ep1-v1</Pill>).</li>
                    <li>Select your <strong className="text-foreground">NLE target</strong> — DaVinci, Premiere, CapCut, Descript, or Generic.</li>
                    <li>Toggle what to include: Script, Character Bible + Style Lock, Continuity Log, NLE markers.</li>
                    <li>Click <strong className="text-foreground">Export package</strong>. Files download individually.</li>
                  </ol>
                  <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                    <p className="mb-2 text-[12px] font-medium text-foreground">Files in the package</p>
                    <ul className="space-y-1 text-[11.5px]">
                      <li><Pill>CLIP_MANIFEST.json</Pill> — numbered shots with duration and transitions</li>
                      <li><Pill>script.md</Pill> — full script from all content nodes</li>
                      <li><Pill>shot-list.md</Pill> — per-shot camera, action, duration, status</li>
                      <li><Pill>character-bible.md</Pill> — locked characters + Style Lock snapshot</li>
                      <li><Pill>continuity-log.md</Pill> — per-scene thread log</li>
                      <li><Pill>nle-markers.[edl/csv/txt]</Pill> — cut points in NLE format</li>
                      <li><Pill>README.txt</Pill> — import instructions</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Callout type="tip" title="Importing in DaVinci Resolve">
                Import the <Pill>.edl</Pill> file via <em>File → Import → Timeline</em>. Use <Pill>CLIP_MANIFEST.json</Pill> to rename and order your clips in the Media Pool first.
              </Callout>
            </div>
          </Section>

          {/* ── PHASE 5 ── */}
          <Section id="phase5" title="Phase 5 — Autopilot with checkpoints" subtitle="Run multi-scene batch generation without losing Director control.">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Batch Planner node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Add from sidebar → <strong className="text-foreground">Batch Planner</strong>.</li>
                    <li>Set <strong className="text-foreground">Shots per batch</strong> (1–20, default 5).</li>
                    <li>Click <strong className="text-foreground">Propose</strong> — ChatGPT reads existing shot counts and open continuity threads, then proposes the next N shots with rationale for each.</li>
                    <li>Review each proposed item — edit labels or rationale, approve (✓) or reject (✗).</li>
                    <li>Click <strong className="text-foreground">Approve plan — unlock generation</strong>. Generation cannot start until this gate is open.</li>
                    <li>Click <strong className="text-foreground">Reset</strong> to start fresh with a new proposal.</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Autopilot Dashboard node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Add from sidebar → <strong className="text-foreground">Autopilot Dashboard</strong>.</li>
                    <li>Set <strong className="text-foreground">Checkpoint frequency</strong>: Every shot / Every scene / Every 5 shots / Every 10 shots.</li>
                    <li>Click <strong className="text-foreground">Start autopilot</strong>. The node syncs progress from Result and Shot List nodes every 3 seconds.</li>
                    <li>The <strong className="text-foreground">progress bar</strong> shows completed/total shots. <strong className="text-foreground">Cost</strong> accumulates from Result provenance. <strong className="text-foreground">Open issues</strong> counts unresolved Continuity Log threads.</li>
                    <li>When a checkpoint threshold is hit, the dashboard shows <strong className="text-foreground">Checkpoint — review required</strong>. Review the batch, then click <strong className="text-foreground">Continue next batch</strong>.</li>
                    <li>Use <strong className="text-foreground">Pause</strong> / <strong className="text-foreground">Resume</strong> / stop (■) to control the run at any time.</li>
                  </ol>
                </div>
              </div>

              <Callout type="warning" title="Never skip checkpoints on long runs">
                Continuity issues compound silently if you skip review gates. Set a realistic checkpoint frequency — "Every 5 shots" is a good default for most projects.
              </Callout>
            </div>
          </Section>

          {/* ── PHASE 6 ── */}
          <Section id="phase6" title="Phase 6 — Multi-episode memory and Series Arc" subtitle="Keep characters and story threads consistent across episodes.">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Episode Memory node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <p>One node per episode boundary. Persists state to a series-wide store in localStorage.</p>
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Set <strong className="text-foreground">Series ID</strong> — a shared string across all episodes (e.g. <Pill>aperture-series</Pill>).</li>
                    <li>Set the episode number.</li>
                    <li>Click <strong className="text-foreground">Sync from Bible</strong> to import all locked characters.</li>
                    <li>Expand each character card: fill exit state (what happened by episode end), entry state for next episode, wardrobe at end.</li>
                    <li>Fill revealed facts, open threads, resolved threads, director notes.</li>
                    <li>Click <strong className="text-foreground">Save episode to series memory</strong>.</li>
                  </ol>
                  <p className="mt-2"><strong className="text-foreground">Loading handoff from previous episode:</strong> On the next episode's node, set the same Series ID and episode N+1, then click <strong className="text-foreground">Load exit states from episode N</strong>. Previous exit states auto-populate as entry states.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Series Arc node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <p>Season-wide arc tracker with beat-by-beat progress.</p>
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Add from sidebar → <strong className="text-foreground">Series Arc</strong>.</li>
                    <li>Fill series title, total episodes, current episode.</li>
                    <li>Add arc beats — each covers an episode range with label, description, status (planned / written / generated / complete), character milestones, open/resolved threads.</li>
                    <li>Track overarching themes and series-wide character arcs at the top.</li>
                    <li>The progress bar shows complete beats / total beats.</li>
                  </ol>
                </div>
              </div>
            </div>
          </Section>

          {/* ── PHASE 7 ── */}
          <Section id="phase7" title="Phase 7 — Packs, Social Variants, Team Workspace" subtitle="Make ScriptFlora native for your project type and team.">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Project Pack node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <p>Select a pack to apply medium-specific defaults across the canvas.</p>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-white/[0.07] text-left text-[10.5px] text-muted-foreground/60">
                          <th className="pb-2 pr-4 font-medium">Pack</th>
                          <th className="pb-2 font-medium">Key defaults</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-muted-foreground">
                        {[
                          ['Ads / Commercials', 'Short shots, identity lock required, every-shot checkpoints'],
                          ['Series / Episodic Drama', 'Series memory on, scene-level checkpoints, identity lock'],
                          ['Animation / Cartoon', 'Animation medium, character sheet enforced, style lock heavy'],
                          ['Educational / Training', 'Standard skill, scene checkpoints, no forced identity lock'],
                          ['Hybrid', 'Mixed medium, 5-shot checkpoints'],
                        ].map(([pack, defaults]) => (
                          <tr key={pack as string}>
                            <td className="py-2 pr-4 font-medium text-foreground">{pack as string}</td>
                            <td className="py-2">{defaults as string}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2">Click <strong className="text-foreground">Apply defaults</strong>. The pack fires a canvas event — Autopilot Dashboard and Style Lock nodes respond to it.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Social Variants node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Click <strong className="text-foreground">+ YouTube</strong>, <strong className="text-foreground">+ Instagram</strong>, etc. to add platform variants with preset aspect ratios and max durations.</li>
                    <li>Edit the label for each variant.</li>
                    <li>Upload a thumbnail or describe one in the prompt field.</li>
                    <li>Mark each variant as exported when done (✓).</li>
                    <li>Set a publish schedule — free text (e.g. "YouTube: Monday 9am UTC").</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[13.5px] font-medium text-foreground">Team Workspace node</h3>
                <div className="space-y-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <ol className="ml-4 list-decimal space-y-1.5">
                    <li>Set workspace name and <strong className="text-foreground">brand kit notes</strong> (colours, fonts, tone guidelines — referenced by HyperFrames templates).</li>
                    <li>Toggle <strong className="text-foreground">Team approval required before export</strong> to enforce a sign-off gate.</li>
                    <li>Add <strong className="text-foreground">comments</strong> with author (optional) and text. Press ⌘Enter to submit.</li>
                    <li>Click ✓ on a comment to resolve it. Re-open with the same button.</li>
                  </ol>
                </div>
              </div>
            </div>
          </Section>

          {/* ── ALL NODES ── */}
          <Section id="all-nodes" title="All nodes quick reference">
            <div className="grid gap-3 sm:grid-cols-2">
              <NodeCard icon={FileText} name="Brief" phase="0" color="text-primary/80">
                <p>Project intake. Fill Title, Objective, Audience, Duration, Tone, Key Facts. Confirm gate required before generation.</p>
              </NodeCard>
              <NodeCard icon={Layers} name="Skill Selector" phase="0" color="text-primary/80">
                <p>Choose Standard Script or Auteur Script. Import custom .md skills from the sidebar.</p>
              </NodeCard>
              <NodeCard icon={ShieldCheck} name="Continuity Checker" phase="0" color="text-cyan-400">
                <p>Reads all canvas content + brief context. Returns 0–100 score and issue list.</p>
              </NodeCard>
              <NodeCard icon={LayoutGrid} name="Multi-Format Output" phase="0" color="text-orange-400">
                <p>Toggle formats, download separate files: Screenplay, Shot list, Voiceover, Social, Beat sheet.</p>
              </NodeCard>
              <NodeCard icon={ArrowDownToLine} name="Export" phase="0" color="text-success">
                <p>Downloads full script as Markdown / Final Draft / Fountain / Word / PDF.</p>
              </NodeCard>
              <NodeCard icon={Users} name="Character Bible" phase="1" color="text-amber-400">
                <p>Character identity: image lock, voice profile, wardrobe. Locked characters gate video generation.</p>
              </NodeCard>
              <NodeCard icon={Globe} name="World / Style Lock" phase="1" color="text-teal-400">
                <p>Visual rules, medium, hard constraints. Lock to inject into all generations.</p>
              </NodeCard>
              <NodeCard icon={BookMarked} name="Continuity Log" phase="1" color="text-indigo-400">
                <p>Per-scene character states, revealed facts, open threads, wardrobe changes.</p>
              </NodeCard>
              <NodeCard icon={Clapperboard} name="Shot List" phase="2" color="text-yellow-500">
                <p>Expand script scene into ordered shots with camera, action, dialogue, continuity notes.</p>
              </NodeCard>
              <NodeCard icon={ImageIcon} name="Storyboard Frame" phase="2" color="text-pink-400">
                <p>Key-frame image per shot. Approve to use as video reference in Phase 3.</p>
              </NodeCard>
              <NodeCard icon={Film} name="Sequence" phase="2" color="text-violet-400">
                <p>Ordered shot skeleton (no media). Sync from Shot Lists, reorder with arrows.</p>
              </NodeCard>
              <NodeCard icon={Play} name="Generate Shot" phase="3" color="text-primary">
                <p>Runway model router. Set priority, shot-type flags, see routed model + cost estimate before generating.</p>
              </NodeCard>
              <NodeCard icon={Video} name="Result" phase="3" color="text-primary/80">
                <p>Clip + audio + full generation provenance. Approve / reject / view model details.</p>
              </NodeCard>
              <NodeCard icon={Flag} name="Checkpoint" phase="3" color="text-success">
                <p>Human gate. Set required approval count. Sync from canvas. Opens next batch when met.</p>
              </NodeCard>
              <NodeCard icon={Scissors} name="Timeline" phase="4" color="text-orange-400">
                <p>Rough-cut preview. Sync approved clips, reorder, set cut/fade transitions, play.</p>
              </NodeCard>
              <NodeCard icon={Package} name="Export Package" phase="4" color="text-amber-500">
                <p>Full NLE handoff: clips manifest, script, shot list, Bible, continuity log, NLE markers.</p>
              </NodeCard>
              <NodeCard icon={Sparkles} name="Batch Planner" phase="5" color="text-violet-400">
                <p>Director proposes next N shots. Review + approve the plan before any generation runs.</p>
              </NodeCard>
              <NodeCard icon={Gauge} name="Autopilot Dashboard" phase="5" color="text-emerald-400">
                <p>Start/pause/stop autopilot. Shows progress, cost, open issues. Fires checkpoints on schedule.</p>
              </NodeCard>
              <NodeCard icon={BookOpen} name="Episode Memory" phase="6" color="text-sky-400">
                <p>Save episode exit states, character snapshots, revealed facts. Load handoff from previous episode.</p>
              </NodeCard>
              <NodeCard icon={Tv} name="Series Arc" phase="6" color="text-indigo-500">
                <p>Season-wide arc beats with status, character milestones, open/resolved threads.</p>
              </NodeCard>
              <NodeCard icon={Clapperboard} name="Project Pack" phase="7" color="text-rose-400">
                <p>Apply medium-specific defaults (Ads, Series, Animation, Education, Hybrid) across canvas.</p>
              </NodeCard>
              <NodeCard icon={Share2} name="Social Variants" phase="7" color="text-cyan-400">
                <p>Platform cuts with preset aspect ratios, thumbnail slot, publish schedule.</p>
              </NodeCard>
              <NodeCard icon={Users} name="Team Workspace" phase="7" color="text-blue-400">
                <p>Brand kit notes, approval gate, threaded comments with resolve/re-open.</p>
              </NodeCard>
            </div>
          </Section>

          {/* ── SKILLS ── */}
          <Section id="skills" title="Skills">
            <div className="space-y-6">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
                <h3 className="mb-2 flex items-center gap-2 text-[13.5px] font-medium text-foreground">
                  <Layers className="size-4 text-primary/80" /> Standard Script
                </h3>
                <p className="mb-3 text-[12.5px] leading-relaxed text-muted-foreground">Classic scriptwriting structure. Best for brand films, educational videos, ads, and social content.</p>
                <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
                  {['Hook ×1', '→', 'Scene ×N', '+', 'Dialogue ×N', '+', 'Visual ×N', '→', 'CTA ×1'].map((s, i) => (
                    <span key={i} className={s === '→' || s === '+' ? 'text-muted-foreground/40' : 'rounded-md border border-white/[0.07] bg-black/20 px-2 py-0.5 font-mono text-[10.5px]'}>{s}</span>
                  ))}
                </div>
                <p className="mt-3 text-[12px] text-muted-foreground">N scales with duration: 15s→2 beats, 60s→4, 90s+→6.</p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
                <h3 className="mb-2 flex items-center gap-2 text-[13.5px] font-medium text-foreground">
                  <WandSparkles className="size-4 text-violet-400" /> Storyline Auteur Script
                </h3>
                <p className="mb-3 text-[12.5px] leading-relaxed text-muted-foreground">Advanced pipeline based on the <em>Frequency Over Force</em> method. Designed for dialogue-heavy, spatially continuous scenes intended for AI video models. Follow stages in strict order.</p>
                <ol className="space-y-1.5 text-[12.5px] text-muted-foreground">
                  {[
                    ['Stageplay', 'Dialogue only. Natural speech rhythm.'],
                    ['Screenplay', 'Format + atmosphere, sound, light quality.'],
                    ['Technical Screenplay', 'Full physical blocking. Every micro-movement.'],
                    ['Production Summary', 'Visual rule sheet. Lock wardrobe, props, environment.'],
                    ['Auteur Script', '20–30s generation chunks with [INTENT], [LOGIC], [AESTHETIC] scaffold.'],
                  ].map(([stage, desc], i) => (
                    <li key={stage as string} className="flex gap-2.5">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-violet-400/20 bg-violet-400/10 font-mono text-[10px] text-violet-400">{i + 1}</span>
                      <span><strong className="text-foreground">{stage as string}</strong> — {desc as string}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Section>

          {/* ── CUSTOM SKILLS ── */}
          <Section id="custom-skills" title="Building custom skills">
            <div className="space-y-5 text-[13px] leading-7 text-muted-foreground">
              <p>A <strong className="text-foreground">skill</strong> is a plain Markdown file. ScriptFlora uses it as the system prompt methodology for generation.</p>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="mb-2 text-[12.5px] font-medium text-foreground">How to import</p>
                <ol className="ml-4 list-decimal space-y-1 text-[12.5px]">
                  <li>Open the left sidebar. Expand <strong className="text-foreground">Techniques</strong>.</li>
                  <li>Click <strong className="text-foreground">Import skill</strong> and pick your <Pill>.md</Pill> or <Pill>.txt</Pill> file.</li>
                  <li>The skill appears in the list. Drag to canvas or click to drop a Skill node.</li>
                  <li>Open the Skill node, select your skill from the dropdown, and click Generate.</li>
                </ol>
              </div>

              <div>
                <p className="mb-3 text-[12.5px] font-medium text-foreground">Required file structure</p>
                <div className="rounded-xl border border-white/[0.08] bg-black/25 p-4 font-mono text-[11.5px] leading-relaxed text-foreground/80">
                  <p className="text-primary/80"># Skill: Your Skill Name</p>
                  <p className="mt-3 text-muted-foreground">## Description</p>
                  <p>What this skill is for.</p>
                  <p className="mt-3 text-muted-foreground">## Pipeline Stages</p>
                  <p>1. Stage Name — what it produces</p>
                  <p>2. Stage Name — ...</p>
                  <p className="mt-3 text-muted-foreground">## Generation Rules</p>
                  <p>- Always respect Brief key facts</p>
                  <p>- [Your rules here]</p>
                  <p className="mt-3 text-muted-foreground">## Node Mapping (generated in order)</p>
                  <p className="text-primary/70">- hook (×1)</p>
                  <p className="text-primary/70">- scene (×N)</p>
                  <p className="text-primary/70">- cta (×1)</p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[12.5px] font-medium text-foreground">Available node kinds for Node Mapping</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ['hook', 'Opening — first seconds'],
                    ['scene', 'Content beat (repeatable ×N)'],
                    ['dialogue', 'Spoken content'],
                    ['visual', 'Camera, light, motion'],
                    ['cta', 'Call to action — the close'],
                    ['auteur-stageplay', 'Dialogue-only (Auteur I)'],
                    ['auteur-screenplay', 'Format + atmosphere (Auteur II)'],
                    ['auteur-technical', 'Full blocking (Auteur III)'],
                    ['auteur-production-summary', 'Visual rule sheet (Auteur IV)'],
                    ['auteur-script', 'Macro-state chunks (Auteur V)'],
                  ].map(([kind, desc]) => (
                    <div key={kind as string} className="flex gap-2 rounded-lg border border-white/[0.06] p-2.5">
                      <code className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{kind as string}</code>
                      <span className="text-[11.5px] text-muted-foreground">{desc as string}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Callout type="tip" title="Tips for effective skills">
                <ul className="space-y-1">
                  <li>Be specific in Generation Rules — vague rules produce vague output.</li>
                  <li>Include duration scaling (e.g. "15 min → 2 segments, 30 min → 4").</li>
                  <li>The Node Mapping section is mandatory — without it the generator won't know what to create.</li>
                  <li>Test with a complete Brief (audience, duration, tone, key facts).</li>
                </ul>
              </Callout>
            </div>
          </Section>

          {/* ── SHORTCUTS ── */}
          <Section id="shortcuts" title="Keyboard shortcuts">
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ['L', 'Lock selected nodes'],
                ['U', 'Unlock selected nodes'],
                ['A', 'Approve selected content nodes'],
                ['⌘D / Ctrl+D', 'Duplicate selected nodes'],
                ['Delete / ⌫', 'Delete selected (locked are skipped)'],
                ['S', 'Toggle pointer ↔ select mode'],
                ['F', 'Fit canvas view'],
                ['Shift + click', 'Add to selection'],
                ['?', 'Toggle shortcut help'],
                ['Esc', 'Close panels / deselect'],
                ['⌘Enter (in prompts)', 'Submit / generate'],
              ].map(([key, desc]) => (
                <div key={key as string} className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3.5 py-2.5">
                  <span className="text-[12px] text-muted-foreground">{desc as string}</span>
                  <kbd className="ml-4 shrink-0 rounded-md border border-white/[0.12] bg-white/[0.06] px-2 py-0.5 font-mono text-[10.5px] text-foreground/80">{key as string}</kbd>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11.5px] text-muted-foreground/60">Shortcuts are disabled while typing in a node field — so you can type freely without triggering actions.</p>
          </Section>

          {/* CTA */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="mb-1 text-base font-medium text-foreground">Ready to direct?</p>
            <p className="mb-4 text-[13px] text-muted-foreground">Open the app and build your first project.</p>
            <Link href="/projects" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground hover:opacity-90">
              <FolderKanban className="size-3.5" />
              Go to projects
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
