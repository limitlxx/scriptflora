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
  - **Series Script Structure** — Series Hook → Episode Outline → Act Beat → Series Visual Notes → Episode Close; designed for episodic drama and long-form series with multi-episode continuity planning
- **Per-node regeneration** — regenerate any single node (e.g. just the Hook) while the full brief, key facts, and locked/upstream content are preserved as context.
- **Lock / Edit / Approve controls** — lock strong sections so they're never overwritten, edit inline, and mark nodes as approved.
- **Continuity & fact protection** — key facts from the brief are injected into every generation call. The Continuity Checker node flags missing facts or inconsistencies, and each error/warning issue now shows an **Apply fix** button: clicking it calls `POST /api/continuity-fix` with the issue, the target node's content, and the full script context; a proposed rewrite is shown inline for review — accept to patch the node, dismiss to ignore. Locked/approved nodes are protected and cannot be patched.
- **Multi-format output** — generate multiple versions of a script (e.g. short-form vertical vs. long-form) from the same master content.
- **Export** — copy to clipboard or download as clean Markdown.
- **Local-first persistence** — projects are saved in the browser (Zustand + IndexedDB), with support for multiple saved scripts and fast restore on reload.
- **Login with ChatGPT** — users authenticate with their own ChatGPT account/subscription; no separate API key or project-paid tokens required for the MVP.

## How It Works

1. Sign in with **Continue with ChatGPT**.
2. Fill out the **Brief Intake** node: topic, objective, audience, platform(s), duration, tone, and key facts. You can also upload a draft document (`.txt`, `.md`, or `.pdf`) to extract fields automatically — inferred fields are flagged for review before you confirm.
3. Pick a **Skill** (Standard Script, Storyline Auteur Script, or Series Script Structure).
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

Authentication uses each user's own ChatGPT subscription — tokens stay server-side in an HttpOnly cookie and never reach the browser. All generation requests are proxied through the app's backend at `/api/chatgpt/[...path]`. The canvas polls `GET /api/chatgpt/session` every 4 minutes to detect session expiry; on a 401 response the user is redirected to `/?session=expired`.

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

Optional variables for media generation:

```bash
# Phase 1/2 — Reference image generation (character sheets, style mood boards)
# Uses OpenAI Images API (gpt-image-1). When absent, placeholder images are returned.
OPENAI_API_KEY=

# Phase 3 — Runway video generation (simulated when absent)
RUNWAY_API_KEY=

# Phase 11 — HyperFrames render mode (three modes, chosen automatically)
HEYGEN_API_KEY=          # HeyGen Cloud render (set this for production)
HYPERFRAMES_LOCAL=true   # Local CLI render instead of cloud (opt-in; overrides HEYGEN_API_KEY)
HYPERFRAMES_CLI_BIN=     # Override CLI binary path (default: npx hyperframes)
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
│   ├── marketplace/page.tsx  # Phase S3 — Skills Marketplace page (`/marketplace`); hero, trust-tier legend (Official / Verified / Community), and <MarketplaceClient /> for feed + install
├── components/     # UI and canvas/node components
│   ├── marketplace/marketplace-client.tsx  # Client component: feed fetch, search/filter, install actions
├── lib/            # Utilities, state store, and AI/generation helpers
│   ├── toast.ts           # Lightweight event-bus toast store; fire `toast.info/success/warning/error(title, opts?)` from anywhere; renders via a `Toaster` component that subscribes to the `sf:toast` window event; no Zustand dependency
│   ├── skill-studio.ts    # Phase S1 — Skills Studio draft skill store (localStorage, `sf:studio:skills`)
│   ├── marketplace.ts     # Phase S3 — Marketplace feed types + client helpers (`fetchMarketplaceFeed`, `filterSkills`)
├── components/skills-studio/  # Skills Studio UI components
│   ├── skill-list-client.tsx  # Client component: skill list, filter tabs, create/archive/delete actions
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

- Skills Studio UI (`/app/skills`) — the skill list view (`components/skills-studio/skill-list-client.tsx`) is implemented with filter tabs (All / Drafts / Published / Archived), create-new-skill flow (with family picker), archive/restore, and delete; the skill editor (`components/skills-studio/skill-editor-client.tsx`) is implemented with five tabs: **Manifest** (skill ID, publisher, tagline, family, requirements, permissions), **Instructions** (system prompt editor), **Recipe** (stage node builder with key/kind/title/dependsOn), **Test run** (isolated sandbox execution against a test brief — outputs marked `origin: test`, never written to real projects), and **Version** (semver bump, changelog draft, publish gate that requires a successful test run); **Team Library** (`/app/skills/library`) — implemented in `components/skills-studio/team-library-client.tsx`; two tabs: **Installed** (browse installed skills with trust tier badges — Official / Verified / Community — toggle enable/disable, uninstall non-built-ins, export any skill as a JSON package for sharing, import `.json` packages from team members with permission validation against the Community tier, and review declared permissions per skill) and **Audit log** (timestamped record of every install, uninstall, enable, and disable action); built-in skills are always present and cannot be uninstalled
- Real-time multi-user collaboration or cloud project sync
- HyperFrames node UI — implemented (Phase 11); render route `POST /api/hyperframes/render` and status polling `GET /api/hyperframes/status?taskId=` support three modes: **simulated** (no keys), **HeyGen Cloud** (`HEYGEN_API_KEY` set), **Local CLI** (`HYPERFRAMES_LOCAL=true`)
- `POST /api/generate-reference-image` — generates character reference sheets or style mood boards using OpenAI Images API (`gpt-image-1`); accepts `prompt`, `type` (`character` | `style`), `count` (1–4), and an optional `sourceImage` base64 data URL for image-to-image edits; falls back to placeholder images when `OPENAI_API_KEY` is absent so the Character Bible UI works without a key; requires an active LWC session
- `POST /api/continuity-fix` — given a specific continuity issue (id, severity, message, source), the affected node's content, the full script context, and the brief's key facts, returns `{ fixed: string }` — a rewritten version of that node that resolves the issue; the Continuity Checker node shows this proposal inline and requires explicit "Accept" before patching; locked/approved nodes are blocked server-side and client-side; requires an active LWC session
- **ScriptFlora Coach (C1)** — in progress; `lib/coach-state.ts` is implemented: `deriveCoachState(nodes, hasChatGPTLogin, route)` reads the live canvas node list and returns a typed `CoachState` snapshot (brief status, character lock state, skill selection, shot/sequence progress, HyperFrames status, and derived blockers); `coachStateToText(s)` converts the snapshot to a plain-text summary for injection into the coach system prompt; `POST /api/coach` is implemented — it collects the full response via the LWC proxy (`createChatGPTProxyProvider` + `streamText`) using the user's own ChatGPT session and returns `{ content: string }` as JSON (same pattern as `/api/generate`); returns `401` if the response is empty, which typically indicates session expiry; loads and caches knowledge-bank docs from `public/coach-docs/` (director-method, nodes-reference, skills-guide, gates-and-blockers, hyperframes-guide), and enforces the same safety rules as the Coach PRD; the `CoachRail` UI and `CoachSpotlight` overlay are not yet implemented
- **Detachable Panel System (P1)** — in progress; `NodesLibraryPanel`, `InspectorPanel`, and `PanelToggleButton` components are wired into `script-flow-canvas.tsx`; the currently selected node is tracked via `useMemo` and passed to the Inspector panel; panel layout state managed by `lib/panel-store` (Zustand, persisted to localStorage); `panelActions` exposes `resetPosition(id)` (snap a panel back to its default position) and `stackAll()` (cascade all visible floating panels with an offset so none are hidden behind each other); a **canvas right-click context menu** (`CanvasContextMenu` in `script-flow-canvas.tsx`) provides quick access to "Add node here", "Stack all panels", and "Reset all panels" directly from the canvas; generation errors and preflight messages are surfaced via `<ToastStack />` (rendered inside the canvas) rather than inline props on `TopBar`
- Actual video generation (Runway integration exists behind `RUNWAY_API_KEY`; HeyGen HyperFrames packaging requires `HEYGEN_API_KEY`)
- Advanced React Flow features (grouping, custom edge routing, etc.)
- Mobile-first responsive design
- Usage analytics and team workspaces
- Support for AI providers beyond ChatGPT (Anthropic/Google API keys are a planned future addition)

## Contributing

Issues and pull requests are welcome. If you're planning a larger change, please open an issue first to discuss what you'd like to change.

## License

No license has been specified for this repository yet. Until one is added, all rights are reserved by the author.