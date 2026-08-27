import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Check,
  FileText,
  FolderKanban,
  Layers,
  Lock,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
  LayoutGrid,
  ArrowDownToLine,
  WandSparkles,
  Eye,
  Milestone,
  Camera,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Docs — ScriptFlora',
  description: 'Learn how to use ScriptFlora nodes and build structured scripts.',
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-4 text-xl font-medium tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  )
}

function NodeCard({
  icon: Icon,
  name,
  color = 'text-muted-foreground',
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  name: string
  color?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex size-7 items-center justify-center rounded-lg border border-white/[0.08] bg-black/30">
          <Icon className={`size-3.5 ${color}`} />
        </span>
        <span className="text-[13px] font-medium text-foreground">{name}</span>
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

const NAV = [
  { id: 'quickstart', label: 'Quick start' },
  { id: 'canvas', label: 'Canvas basics' },
  { id: 'nodes', label: 'All nodes' },
  { id: 'actions', label: 'Node actions' },
  { id: 'skills', label: 'Skills' },
  { id: 'custom-skills', label: 'Custom skills' },
  { id: 'generation', label: 'Generating' },
  { id: 'continuity', label: 'Continuity checker' },
  { id: 'output', label: 'Multi-format output' },
  { id: 'export', label: 'Exporting' },
  { id: 'tips', label: 'Tips & shortcuts' },
]

export default function DocsPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-white/[0.06] bg-background/80 px-5 backdrop-blur-xl md:px-10">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            ScriptFlora
          </Link>
          <span className="text-white/20">/</span>
          <span className="flex items-center gap-1.5 text-[12px] text-foreground/80">
            <BookOpen className="size-3.5" />
            Documentation
          </span>
        </div>
        <Link
          href="/projects"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:opacity-90"
        >
          <Sparkles className="size-3" />
          Open app
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-6xl gap-10 px-5 py-10 md:px-10 md:py-14">
        {/* Sidebar nav */}
        <aside className="hidden w-48 shrink-0 lg:block">
          <div className="sticky top-20">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">
              Contents
            </p>
            <nav className="flex flex-col gap-0.5">
              {NAV.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="rounded-lg px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 space-y-14">
          {/* Hero */}
          <div>
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-primary/80">
              Documentation
            </p>
            <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
              ScriptFlora guide
            </h1>
            <p className="mt-4 max-w-prose text-[14px] leading-7 text-muted-foreground">
              ScriptFlora is a node-based AI scriptwriting canvas. You connect a creative brief to a
              writing skill, click Generate, and receive a fully structured script — one editable node
              per stage. Every section can be locked, regenerated independently, approved, or
              duplicated. Nothing is overwritten without your permission.
            </p>
          </div>

          {/* ── Quick start ── */}
          <Section id="quickstart" title="Quick start">
            <div className="space-y-5">
              <Step n={1} title="Sign in with ChatGPT">
                Click <strong>Continue with ChatGPT</strong> on the landing page. ScriptFlora uses
                your own ChatGPT subscription — no separate API key needed. Tokens are never
                exposed to the browser.
              </Step>
              <Step n={2} title="Create a project">
                You land on the <strong>Projects</strong> page. Click <strong>New project</strong>,
                give it a name and format, then click <strong>Create &amp; open</strong>. Each
                project has its own canvas.
              </Step>
              <Step n={3} title="Add a Brief node">
                On an empty canvas, click <strong>New Brief</strong> or drag one from the sidebar.
                Fill in title, objective, audience, platforms, duration, tone, and any key facts that
                the script must never contradict.
              </Step>
              <Step n={4} title="Add a Skill node and connect it">
                Drag a <strong>Skill Selector</strong> node onto the canvas. Choose
                <em> Standard Script</em> or <em> Auteur Script</em>. Then drag from the Brief
                node's right handle to the Skill node's left handle to connect them.
              </Step>
              <Step n={5} title="Click Generate">
                Hit the <strong>Generate</strong> button in the top bar. ScriptFlora reads your brief
                and skill, calls the model, and fans out a full set of content nodes — one per stage.
              </Step>
              <Step n={6} title="Review, edit, lock, and export">
                Read each generated stage. Edit inline. Lock sections you're happy with. Regenerate
                sections that need work. When ready, use the <strong>Export</strong> node to download
                your script as Markdown.
              </Step>
            </div>
          </Section>

          {/* ── Canvas basics ── */}
          <Section id="canvas" title="Canvas basics">
            <div className="space-y-3 text-[13px] leading-7 text-muted-foreground">
              <p>
                The canvas is a free-form <strong className="text-foreground">React Flow</strong>{' '}
                workspace. Nodes can be dragged anywhere. Edges carry data from left (source) to
                right (target).
              </p>
              <ul className="ml-4 list-disc space-y-1.5">
                <li>
                  <strong className="text-foreground">Drag</strong> nodes to reposition them.
                </li>
                <li>
                  <strong className="text-foreground">Drag from a handle</strong> (the small dot on
                  a node edge) to draw a connection.
                </li>
                <li>
                  <strong className="text-foreground">Double-click the empty canvas</strong> to open
                  the Add Node menu.
                </li>
                <li>
                  <strong className="text-foreground">Drag from the sidebar</strong> to drop a node
                  at a precise position.
                </li>
                <li>
                  <strong className="text-foreground">Zoom controls</strong> are at the bottom
                  centre. Use scroll to zoom, click-drag to pan.
                </li>
                <li>
                  <strong className="text-foreground">Minimap</strong> is in the bottom right —
                  drag it to navigate large graphs.
                </li>
                <li>
                  <strong className="text-foreground">Project name</strong> is editable in the top
                  bar. Changes sync instantly.
                </li>
                <li>
                  The canvas <strong className="text-foreground">autosaves</strong> to your browser
                  on every change — no manual save needed.
                </li>
              </ul>
            </div>
          </Section>

          {/* ── All nodes ── */}
          <Section id="nodes" title="All nodes">
            <div className="grid gap-4 sm:grid-cols-2">
              <NodeCard icon={FileText} name="Brief" color="text-primary/80">
                <p>The input to everything. Fill in every field you can — the more context, the better the generated script.</p>
                <p className="mt-1"><strong className="text-foreground">Key Facts</strong> are hard constraints. The model is instructed never to contradict them.</p>
                <p className="mt-1">Connect Brief → Skill before generating.</p>
              </NodeCard>

              <NodeCard icon={Layers} name="Skill Selector" color="text-primary/80">
                <p>Determines the shape of the generated pipeline. Choose once per project.</p>
                <p className="mt-1"><Pill>Standard Script</Pill> — Hook, Scenes, Dialogue, Visuals, CTA.</p>
                <p className="mt-1"><Pill>Auteur Script</Pill> — 5-stage Frequency Over Force funnel.</p>
              </NodeCard>

              <NodeCard icon={Zap} name="Hook" color="text-yellow-400">
                <p>The opening seconds. Must grab attention immediately. Generated once per script.</p>
              </NodeCard>

              <NodeCard icon={Milestone} name="Scene" color="text-blue-400">
                <p>A single content beat. Repeatable — Standard Script generates N scenes based on duration. Each scene gets its own Dialogue and Visual Directions node.</p>
              </NodeCard>

              <NodeCard icon={MessageSquare} name="Dialogue / Narration" color="text-emerald-400">
                <p>The spoken words for a scene beat. One per scene. Keeps voice natural and on-tone.</p>
              </NodeCard>

              <NodeCard icon={Camera} name="Visual Directions" color="text-purple-400">
                <p>Camera language, lighting, b-roll, transitions. One per scene. Feeds the shot list format.</p>
              </NodeCard>

              <NodeCard icon={Target} name="Call to Action" color="text-rose-400">
                <p>The closing line. Resolves the story and lands the required action. Generated once.</p>
              </NodeCard>

              <NodeCard icon={WandSparkles} name="Auteur Stages" color="text-violet-400">
                <p>Five nodes for the Auteur skill in strict order:</p>
                <ol className="ml-3 mt-1 list-decimal space-y-0.5">
                  <li>Stageplay — dialogue only</li>
                  <li>Screenplay — format + atmosphere</li>
                  <li>Technical Screenplay — full blocking</li>
                  <li>Production Summary — visual rule sheet</li>
                  <li>Auteur Script — macro-state chunks</li>
                </ol>
              </NodeCard>

              <NodeCard icon={ShieldCheck} name="Continuity Checker" color="text-cyan-400">
                <p>Reads all content nodes and checks for consistency. Click <strong className="text-foreground">Run check</strong> to analyse. Returns a 0–100 score and a list of issues.</p>
                <p className="mt-1">Falls back to a key-fact heuristic check when the AI call is unavailable.</p>
              </NodeCard>

              <NodeCard icon={LayoutGrid} name="Multi-Format Output" color="text-orange-400">
                <p>Toggle on the formats you need, then click <strong className="text-foreground">Download</strong>. Generates separate files for each enabled format from your canvas content.</p>
              </NodeCard>

              <NodeCard icon={ArrowDownToLine} name="Export" color="text-success">
                <p>Downloads a clean Markdown file of the full script. Shows a warning if content nodes are empty. Sets status to Approved on success.</p>
              </NodeCard>
            </div>
          </Section>

          {/* ── Node actions ── */}
          <Section id="actions" title="Node actions">
            <p className="mb-5 text-[13px] leading-7 text-muted-foreground">
              Hover over any node to reveal its toolbar. Actions appear as icon buttons above the node.
            </p>
            <div className="space-y-3">
              {[
                { icon: Eye, label: 'Preview', desc: 'Opens a full-screen modal showing the rendered content. Available on content nodes with text.' },
                { icon: RefreshCw, label: 'Regenerate', desc: 'Calls the AI to rewrite this node only. Sends the full brief and upstream context. Locked nodes cannot be regenerated.' },
                { icon: Check, label: 'Approve', desc: 'Marks the node as approved. Approved nodes are never overwritten during re-runs. Toggle off to return to Draft.' },
                { icon: Lock, label: 'Lock / Unlock', desc: 'Locked nodes are visually dimmed and cannot be edited or regenerated until unlocked. Use this to protect sections you\'ve hand-crafted.' },
                { icon: WandSparkles, label: 'Duplicate', desc: 'Creates a copy of the node 40px offset. Useful for creating variations.' },
                { icon: Target, label: 'Delete', desc: 'Removes the node and all its connected edges. Cannot be undone.' },
              ].map((action) => (
                <div key={action.label} className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.01] p-3.5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-black/20">
                    <action.icon className="size-3 text-muted-foreground" />
                  </span>
                  <div>
                    <p className="mb-0.5 text-[12.5px] font-medium text-foreground">{action.label}</p>
                    <p className="text-[12px] leading-relaxed text-muted-foreground">{action.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="mb-1.5 text-[12.5px] font-medium text-primary">Using the prompt field</p>
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                Every content node has a collapsible <strong className="text-foreground">Prompt</strong>{' '}
                field. Type specific instructions (e.g. "make this funnier", "cut to 30 words",
                "start with a question"). Once you've typed something, a{' '}
                <strong className="text-foreground">Run prompt</strong> button appears — click it to
                regenerate that node using your custom instruction combined with the full brief context.
              </p>
            </div>
          </Section>

          {/* ── Skills ── */}
          <Section id="skills" title="Skills">
            <div className="space-y-6">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
                <h3 className="mb-2 flex items-center gap-2 text-[13.5px] font-medium text-foreground">
                  <Layers className="size-4 text-primary/80" />
                  Standard Script
                </h3>
                <p className="mb-3 text-[12.5px] leading-relaxed text-muted-foreground">
                  Classic scriptwriting structure. Best for brand films, educational videos,
                  advertisements, and social content.
                </p>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/60">Pipeline</p>
                <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]">
                  {['Hook ×1', '→', 'Scene ×N', '+', 'Dialogue ×N', '+', 'Visual ×N', '→', 'CTA ×1'].map((s, i) => (
                    <span key={i} className={s === '→' || s === '+' ? 'text-muted-foreground/40' : 'rounded-md border border-white/[0.07] bg-black/20 px-2 py-0.5 font-mono text-[10.5px]'}>{s}</span>
                  ))}
                </div>
                <p className="mt-3 text-[12px] text-muted-foreground">N scales with duration: 15s → 2 beats, 30s → 3, 60s → 4, 90s+ → 5–6.</p>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
                <h3 className="mb-2 flex items-center gap-2 text-[13.5px] font-medium text-foreground">
                  <WandSparkles className="size-4 text-violet-400" />
                  Storyline Auteur Script
                </h3>
                <p className="mb-3 text-[12.5px] leading-relaxed text-muted-foreground">
                  Advanced pipeline based on the <em>Frequency Over Force</em> method. Designed for
                  dialogue-heavy, spatially continuous scenes intended for generative AI video models.
                  Each stage builds on the previous — never skip one.
                </p>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/60">5-stage funnel (strict order)</p>
                <ol className="space-y-1.5 text-[12.5px] text-muted-foreground">
                  {[
                    ['Stageplay', 'Dialogue only. Natural speech rhythm. No stage directions yet.'],
                    ['Screenplay', 'Standard format. Add atmosphere, sound, light quality.'],
                    ['Technical Screenplay', 'Full physical blocking. Stage Left/Right, every micro-movement.'],
                    ['Production Summary', 'Visual rule sheet. Lock wardrobe, props, environment.'],
                    ['Auteur Script', '20–30s generation chunks with [INTENT], [LOGIC], [AESTHETIC], [OPENING], [EXECUTION] scaffold.'],
                  ].map(([stage, desc], i) => (
                    <li key={stage} className="flex gap-2.5">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-violet-400/20 bg-violet-400/10 font-mono text-[10px] text-violet-400">{i + 1}</span>
                      <span><strong className="text-foreground">{stage}</strong> — {desc}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Section>

          {/* ── Custom skills ── */}
          <Section id="custom-skills" title="Building custom skills">
            <div className="space-y-5 text-[13px] leading-7 text-muted-foreground">
              <p>
                A <strong className="text-foreground">skill</strong> is a plain Markdown file that
                describes a pipeline methodology. ScriptFlow reads it as the system prompt context
                when generating your script, so the quality of your skill file directly determines
                the quality of the output.
              </p>

              {/* How to import */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="mb-2 text-[12.5px] font-medium text-foreground">How to import</p>
                <ol className="ml-4 list-decimal space-y-1 text-[12.5px]">
                  <li>Open the left sidebar on the canvas.</li>
                  <li>Expand <strong className="text-foreground">Techniques</strong>.</li>
                  <li>Click <strong className="text-foreground">Import skill</strong> and pick your <Pill>.md</Pill> or <Pill>.txt</Pill> file.</li>
                  <li>The skill appears in the list — drag it to the canvas or click to drop a Skill node.</li>
                  <li>Open the Skill node and select your imported skill from the dropdown.</li>
                  <li>Hit <strong className="text-foreground">Generate</strong> — the AI uses your skill file as the methodology.</li>
                </ol>
                <p className="mt-2 text-[11.5px] text-muted-foreground/70">
                  Imported skills persist in your browser — they survive page reloads. Remove them with the × button in the sidebar.
                </p>
              </div>

              {/* File structure */}
              <div>
                <p className="mb-3 text-[12.5px] font-medium text-foreground">Skill file structure</p>
                <p className="mb-3 text-[12.5px]">
                  A skill file has four required sections. The <strong className="text-foreground">Node Mapping</strong> section
                  is the most important — it tells the generator exactly which stages to produce and in what order.
                </p>
                <div className="rounded-xl border border-white/[0.08] bg-black/25 p-4 font-mono text-[11.5px] leading-relaxed text-foreground/80">
                  <p className="text-primary/80"># Skill: Your Skill Name</p>
                  <p className="mt-3 text-muted-foreground">## Description</p>
                  <p>One paragraph explaining what this skill is for and who should use it.</p>
                  <p className="mt-3 text-muted-foreground">## Pipeline Stages (in order)</p>
                  <p>1. <strong>Stage Name</strong> — what this stage produces</p>
                  <p>2. <strong>Stage Name</strong> — what this stage produces</p>
                  <p>3. <strong>Stage Name</strong> — ...</p>
                  <p className="mt-3 text-muted-foreground">## Generation Rules</p>
                  <p>- Always respect the Brief (topic, objective, audience, tone, key facts)</p>
                  <p>- Key facts must never be contradicted</p>
                  <p>- [Add your specific rules here]</p>
                  <p className="mt-3 text-muted-foreground">## Node Mapping (generated in order)</p>
                  <p className="text-primary/70">- hook (×1)</p>
                  <p className="text-primary/70">- scene (×N, repeatable)</p>
                  <p className="text-primary/70">- dialogue (×N)</p>
                  <p className="text-primary/70">- cta (×1)</p>
                </div>
              </div>

              {/* Node kinds */}
              <div>
                <p className="mb-3 text-[12.5px] font-medium text-foreground">Available node kinds</p>
                <p className="mb-3 text-[12.5px]">
                  The node kind names in <strong className="text-foreground">Node Mapping</strong> must match these exact strings — they map directly to the canvas node types:
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ['hook', 'Opening — grabs attention in the first seconds'],
                    ['scene', 'A content beat (repeatable with ×N)'],
                    ['dialogue', 'Spoken content — voice-over or on-screen'],
                    ['visual', 'Camera, light, motion directions'],
                    ['cta', 'Call to action — the close'],
                    ['auteur-stageplay', 'Dialogue-only stage (Auteur Stage I)'],
                    ['auteur-screenplay', 'Format + atmosphere (Auteur Stage II)'],
                    ['auteur-technical', 'Full physical blocking (Auteur Stage III)'],
                    ['auteur-production-summary', 'Visual rule sheet (Auteur Stage IV)'],
                    ['auteur-script', 'Macro-state chunks (Auteur Stage V)'],
                  ].map(([kind, desc]) => (
                    <div key={kind as string} className="flex gap-2 rounded-lg border border-white/[0.06] p-2.5">
                      <code className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{kind}</code>
                      <span className="text-[11.5px] text-muted-foreground">{desc}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[12px] text-muted-foreground/70">
                  Use <code className="rounded bg-white/[0.06] px-1 text-[10.5px]">×N</code> after a kind to mark it as repeatable (e.g. <code className="rounded bg-white/[0.06] px-1 text-[10.5px]">scene (×N)</code>). The number of repeats is inferred from the brief duration and the generation rules you define.
                </p>
              </div>

              {/* Example */}
              <div>
                <p className="mb-3 text-[12.5px] font-medium text-foreground">Example: Podcast episode skill</p>
                <div className="rounded-xl border border-white/[0.08] bg-black/25 p-4 font-mono text-[11px] leading-6 text-foreground/75 whitespace-pre-wrap">{`# Skill: Podcast Episode Script

## Description
A conversational script structure for interview-style or solo podcast episodes.
Designed to feel natural when spoken, with clear segment transitions.

## Pipeline Stages (in order)
1. **Cold Open** – 30s teaser that hooks the listener
2. **Introduction** – Host intro + episode framing
3. **Segment** – Main content block (repeatable, 3–5 per episode)
4. **Transition** – Brief bridge between segments
5. **Call to Action** – Subscribe, review, or follow prompt

## Generation Rules
- Write in a conversational, spoken-word tone
- Avoid dense paragraphs — use short punchy sentences
- Include natural pause markers [...] where appropriate
- Duration determines number of Segment repeats:
  - 15 min → 2 segments
  - 30 min → 4 segments
  - 45 min+ → 6 segments
- Key facts from the Brief must appear in the Introduction

## Node Mapping (generated in order)
- hook (×1)
- scene (×1)
- scene (×N, repeatable — use for Segments)
- dialogue (×N, one per segment)
- cta (×1)`}</div>
              </div>

              {/* Tips */}
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                <p className="mb-2 text-[12.5px] font-medium text-primary">Tips for writing effective skills</p>
                <ul className="space-y-1.5 text-[12px]">
                  <li className="flex gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary/60" /><span><strong className="text-foreground">Be specific in Generation Rules.</strong> Vague rules produce vague output. Include duration scaling, tone constraints, and format preferences.</span></li>
                  <li className="flex gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary/60" /><span><strong className="text-foreground">Name stages clearly.</strong> The stage name in Node Mapping becomes the node label in the canvas. Keep it short and descriptive.</span></li>
                  <li className="flex gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary/60" /><span><strong className="text-foreground">Test with a full Brief.</strong> A skill only shows its strengths when given a complete brief with audience, duration, tone, and key facts.</span></li>
                  <li className="flex gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary/60" /><span><strong className="text-foreground">Use the standard-script.md as a starting point.</strong> Download it from the sidebar, rename it, and modify the stages and rules.</span></li>
                  <li className="flex gap-2"><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary/60" /><span><strong className="text-foreground">The Node Mapping section is mandatory.</strong> Without it, the generator won't know what stages to create.</span></li>
                </ul>
              </div>
            </div>
          </Section>

          {/* ── Generation ── */}
          <Section id="generation" title="Generating scripts">
            <div className="space-y-4 text-[13px] leading-7 text-muted-foreground">
              <p>The Generate button in the top bar runs the full pipeline. It requires:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>A <strong className="text-foreground">Brief node</strong> with at least a title or objective</li>
                <li>A <strong className="text-foreground">Skill node</strong> with a skill selected</li>
                <li>A <strong className="text-foreground">connection</strong> from Brief → Skill</li>
              </ul>
              <p>
                If any of these are missing, the button shows a preflight error explaining exactly
                what's needed.
              </p>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="mb-2 text-[12.5px] font-medium text-foreground">Model &amp; generation settings</p>
                <ul className="space-y-1.5 text-[12.5px]">
                  <li><Pill>gpt-5.5</Pill> — Most capable. Best for complex auteur scripts.</li>
                  <li><Pill>gpt-5.4</Pill> — Balanced speed and quality.</li>
                  <li><Pill>gpt-5.4-mini</Pill> — Fastest. Good for standard scripts and iteration.</li>
                  <li><strong className="text-foreground">Fast</strong> — Available for gpt-5.5 and gpt-5.4. Uses the fast service tier (burns usage faster).</li>
                  <li><strong className="text-foreground">Reasoning</strong> — Low / Med / High. Higher effort = slower but more coherent output.</li>
                </ul>
              </div>

              <p>
                <strong className="text-foreground">Re-running generation</strong> is safe. Locked and
                approved nodes are never overwritten. Nodes that already exist are updated in-place if
                their stage key matches. New stages are added without removing anything.
              </p>
            </div>
          </Section>

          {/* ── Continuity ── */}
          <Section id="continuity" title="Continuity checker">
            <div className="space-y-3 text-[13px] leading-7 text-muted-foreground">
              <p>The Continuity Checker node reads every content node on the canvas and checks for internal consistency.</p>
              <p>To use it:</p>
              <ol className="ml-4 list-decimal space-y-1">
                <li>Add a Continuity node from the sidebar or Add Node menu.</li>
                <li>Connect at least one content node to it (optional — it reads all canvas content regardless).</li>
                <li>Click <strong className="text-foreground">Run check</strong> inside the node.</li>
              </ol>
              <p>It checks:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Whether key facts from the Brief appear in the script</li>
                <li>Character and prop consistency across scenes</li>
                <li>Timeline and spatial contradictions</li>
                <li>Tone deviations</li>
              </ul>
              <p>
                Results show a score (0–100) and a list of issues with severity levels:
                <span className="ml-1 text-destructive">Error</span> (breaks the story),
                <span className="ml-1 text-warning">Warning</span> (possible issue),
                <span className="ml-1 text-muted-foreground">Info</span> (suggestion).
              </p>
            </div>
          </Section>

          {/* ── Output ── */}
          <Section id="output" title="Multi-format output">
            <div className="space-y-3 text-[13px] leading-7 text-muted-foreground">
              <p>The Multi-Format Output node generates separate files from your canvas content in different script formats.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Screenplay', 'Full script as headed Markdown sections. Standard format.'],
                  ['Shot list', 'Table of every scene/visual node. First line = shot description.'],
                  ['Voiceover script', 'Dialogue, hook, and CTA nodes only. For VO recording sessions.'],
                  ['Social cutdowns', 'Hook + CTA condensed. For 15–30s short-form delivery.'],
                  ['Beat sheet', 'One bullet per stage with the opening line. Client-facing summary.'],
                ].map(([name, desc]) => (
                  <div key={name as string} className="rounded-lg border border-white/[0.06] p-3">
                    <p className="mb-1 text-[12.5px] font-medium text-foreground">{name as string}</p>
                    <p className="text-[11.5px]">{desc as string}</p>
                  </div>
                ))}
              </div>
              <p>Toggle on the formats you want, then click the download button. Each enabled format downloads as a separate <Pill>.md</Pill> file.</p>
            </div>
          </Section>

          {/* ── Export ── */}
          <Section id="export" title="Exporting your script">
            <div className="space-y-3 text-[13px] leading-7 text-muted-foreground">
              <p>The Export node downloads the full script as a single formatted file.</p>
              <ol className="ml-4 list-decimal space-y-1">
                <li>Choose your format: Markdown, Final Draft (.fdx), Fountain, Word (.docx), or PDF.</li>
                <li>Set a filename.</li>
                <li>Optionally toggle <strong className="text-foreground">Include production notes</strong>.</li>
                <li>Click <strong className="text-foreground">Export script</strong>.</li>
              </ol>
              <p>
                If the canvas has no content yet, the node shows a warning rather than downloading an
                empty file. Generate your script first, then export.
              </p>
              <p>
                The export reads directly from the canvas — no server round-trip needed. Status updates
                to <span className="text-success font-medium">Approved</span> on success.
              </p>
            </div>
          </Section>

          {/* ── Tips ── */}
          <Section id="tips" title="Tips & shortcuts">
            <div className="space-y-2">
              {[
                ['Start with key facts', 'Fill the Key Facts field in your Brief before generating. These are injected into every prompt as hard constraints.'],
                ['Lock early, iterate fast', 'Lock the hook and CTA as soon as they\'re right. Then regenerate the middle scenes freely without risk.'],
                ['Use the prompt field', 'Expand the Prompt toggle on any content node and type a specific instruction ("make this more urgent") before clicking Run prompt.'],
                ['Re-run safely', 'Click Generate again after editing your Brief to update unlocked stages without losing locked or approved content.'],
                ['Switch skills mid-project', 'You can change the selected skill on the Skill node and re-generate. Existing locked nodes are preserved.'],
                ['Auteur order matters', 'For the Auteur skill, review each stage before moving to the next. The Production Summary is the source of truth for all later visual generation.'],
                ['Multiple pipelines', 'You can have more than one Brief → Skill pipeline on the same canvas. Each Skill node is independent.'],
                ['Double-click empty space', 'Opens the Add Node menu wherever you double-click on the canvas background.'],
              ].map(([title, body]) => (
                <div key={title as string} className="flex gap-3 rounded-xl border border-white/[0.06] p-3.5">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/60" />
                  <div>
                    <p className="mb-0.5 text-[12.5px] font-medium text-foreground">{title as string}</p>
                    <p className="text-[12px] leading-relaxed text-muted-foreground">{body as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* CTA */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="mb-1 text-base font-medium text-foreground">Ready to write?</p>
            <p className="mb-4 text-[13px] text-muted-foreground">Open the app and create your first project.</p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground hover:opacity-90"
            >
              <FolderKanban className="size-3.5" />
              Go to projects
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
