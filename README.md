# ScriptFlora

> Structured scripts. Continuity guaranteed. Human control first.

ScriptFlora is a **node-based AI scriptwriting workspace** built with Next.js and React Flow. It turns a simple creative brief into a structured, editable, multi-format video/audio script — while keeping a human in control at every step.

Instead of a flat chatbot output, ScriptFlora generates a visual pipeline of connected nodes (hook, scenes, dialogue, visuals, CTA, etc.). Each node can be independently locked, edited, and regenerated without losing the original brief, key facts, or continuity across the rest of the script.

Live demo: [scriptflora.vercel.app](https://scriptflora.vercel.app)

## Why

Writers and media teams often start from incomplete briefs and lose hours to:

- Developing a strong hook and clear structure
- Writing natural dialogue and narration
- Adapting one script across multiple durations and platforms
- Redoing entire drafts after a single tone, audience, or length change
- Keeping facts and continuity consistent throughout

Most AI writing tools produce a single block of text that's hard to partially edit and has no awareness of structure or continuity. ScriptFlora replaces that with a visual, skill-driven, section-level controllable workflow.

## Key Features

- **Visual canvas workflow** — brief and script sections are laid out as connected nodes on a React Flow canvas, not a wall of text.
- **Skill-based pipelines** — choose a scriptwriting "skill" and the app generates the matching set of nodes:
  - **Standard Script** — Hook → Scenes/Beats → Dialogue/Narration → Visual Directions → CTA
  - **Storyline Auteur Script** — a 5-stage funnel (Stageplay → Screenplay → Technical Screenplay → Production Summary → Auteur Script) optimized for generative video continuity
- **Per-node regeneration** — regenerate any single node (e.g. just the Hook) while the full brief, key facts, and locked/upstream content are preserved as context.
- **Lock / Edit / Approve controls** — lock strong sections so they're never overwritten, edit inline, and mark nodes as approved.
- **Continuity & fact protection** — key facts from the brief are injected into every generation call, plus a basic Continuity Checker node flags missing facts or inconsistencies.
- **Multi-format output** — generate multiple versions of a script (e.g. short-form vertical vs. long-form) from the same master content.
- **Export** — copy to clipboard or download as clean Markdown.
- **Local-first persistence** — projects are saved in the browser (Zustand + IndexedDB), with support for multiple saved scripts and fast restore on reload.
- **Login with ChatGPT** — users authenticate with their own ChatGPT account/subscription; no separate API key or project-paid tokens required for the MVP.

## How It Works

1. Sign in with **Continue with ChatGPT**.
2. Fill out the **Brief Intake** node: topic, objective, audience, platform(s), duration, tone, and key facts.
3. Pick a **Skill** (Standard Script or Storyline Auteur Script).
4. ScriptFlora generates the corresponding node pipeline on the canvas.
5. Review, edit, lock, and regenerate individual nodes as needed.
6. Optionally run the **Continuity Checker**.
7. Generate multi-format versions of the script.
8. Approve and **export** the final script as Markdown.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) + TypeScript |
| Canvas / Node UI | [React Flow](https://reactflow.dev/) (`@xyflow/react`) |
| State & Persistence | [Zustand](https://github.com/pmndrs/zustand) (with `persist` + IndexedDB) |
| Styling / Components | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Auth & AI Access | [Login with ChatGPT](https://github.com/opencoredev/login-with-chatgpt) SDK, proxied through the app's backend |
| AI SDK | [Vercel AI SDK](https://sdk.vercel.ai/) (`streamText` / `generateObject`) |

Authentication uses each user's own ChatGPT subscription — tokens stay server-side in an HttpOnly cookie and never reach the browser. All generation requests are proxied through the app's backend at `/api/chatgpt/[...path]`.

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- [pnpm](https://pnpm.io/) (the repo uses `pnpm-lock.yaml`)

### Installation

```bash
git clone https://github.com/limitlxx/scriptflora.git
cd scriptflora
pnpm install
```

### Environment Variables

Create a `.env.local` file and configure the Login with ChatGPT integration, at minimum:

```bash
LWC_SECRET=your-stable-secret
```

Refer to the [`opencoredev/login-with-chatgpt`](https://github.com/opencoredev/login-with-chatgpt) documentation for the full list of required variables and setup steps.

### Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
pnpm build
pnpm start
```

## Project Structure

```
scriptflora/
├── app/            # Next.js App Router pages and API routes
├── components/     # UI and canvas/node components
├── lib/            # Utilities, state store, and AI/generation helpers
├── guides/         # Reference guides / internal docs
├── public/         # Static assets
├── PRD.md          # Product Requirements Document
├── IMPLEMENTATION_PLAN.md
├── FRONTEND.md
└── SKILLS.md
```

See [`PRD.md`](./PRD.md) for the full product spec, data model, and build plan, and [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) / [`FRONTEND.md`](./FRONTEND.md) / [`SKILLS.md`](./SKILLS.md) for more implementation detail.

## Roadmap / Out of Scope (MVP)

The current MVP intentionally excludes:

- Real-time multi-user collaboration or cloud project sync
- Actual video generation
- Advanced React Flow features (grouping, custom edge routing, etc.)
- Mobile-first responsive design
- Usage analytics and team workspaces
- Support for AI providers beyond ChatGPT (Anthropic/Google API keys are a planned future addition)

## Contributing

Issues and pull requests are welcome. If you're planning a larger change, please open an issue first to discuss what you'd like to change.

## License

No license has been specified for this repository yet. Until one is added, all rights are reserved by the author.