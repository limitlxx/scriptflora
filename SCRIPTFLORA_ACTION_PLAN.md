# ScriptFlora — Upgrade Action Plan
**The Director's Desk for AI Film**

> Version 6.0 | Updated: Panel system + Coach PRD + HyperFrames implementation corrected  
> Status: Active roadmap  
> Core principle: Create with AI. Review with humans.

---

## What This Document Is

Single source of truth for building ScriptFlora. Every implemented phase is marked. Every future phase has actionable tasks. Two new features added: detachable Panel System and ScriptFlora Coach.

**Director / Brain:** ChatGPT via Login with ChatGPT (user's own subscription)  
**Crew:** Routed video models (Runway first) + voice/TTS models  
**Canvas:** Node-based (React Flow)  
**Stack:** Next.js App Router, TypeScript, Zustand, Tailwind, shadcn/ui  
**Auth:** Login with ChatGPT — mandatory, never replaced

---

## Hard rules (never break these)

1. ChatGPT is the Director — plans, structures, enforces continuity, writes briefs.
2. Video and voice models are crew — they execute under strict briefs and character references.
3. Human checkpoints are mandatory for anything beyond short clips.
4. Generate small units (shots / macro-states), then assemble. Never one-shot long-form.
5. Character images must be locked before video generation is allowed for that character.
6. Media generation never precedes an approved script path.
7. Locked nodes/items are never overwritten unless explicitly unlocked by the user.
8. Skills cannot replace core system nodes (Brief, Bible, Style Lock, Continuity Log, Sequence, Generate Shot, Checkpoint, HyperFrames).
9. Continuity writes must go through the Continuity API — never direct state mutation.

---

## Canonical production order

```
1.  Brief (text) — optionally uploaded from draft doc
2.  Character Bible (text) → Character reference images (lock)
3.  World / Style Lock (text) → optional Style Pack from references
4.  Script via skill pipeline (text nodes)
5.  Shot plan derived from script (text)
6.  Storyboard stills for key shots (images)
7.  Video + voice per shot (media)
8.  Sequence assembly (rough cut)
9.  HyperFrames packaging → designed deliverable
10. Export package → finishing in external NLE or publish
```

---

## What is already built (all phases implemented)

| Phase | Name | Status |
|---|---|---|
| 0 | Stabilize foundation | ✅ Done |
| 1 | Continuity core (Character + World + Voice) | ✅ Done |
| 2 | Shot-layer Director | ✅ Done |
| 3 | Media generation routing (Video + Voice) | ✅ Done |
| 4 | Assembly + export | ✅ Done |
| 5 | Autopilot with checkpoints | ✅ Done |
| 6 | Multi-episode / long-form memory | ✅ Done |
| 7 | Packs, social, team workspaces | ✅ Done |
| 8 | Marketplace readiness (node substrate) | ✅ Done |
| 9 | Upload draft → Brief | ✅ Done |
| 10 | Asset Library | ✅ Done (data layer + sidebar panel) |
| 11 | HyperFrames composition node | ✅ Done (real HTML templates, cloud + local CLI) |
| S0 | Skill manifests foundation | ✅ Done |
| S1 | Skills Studio (internal authoring) | ✅ Done |
| S2 | Team skill sharing | ✅ Done |
| S3 | Public skills marketplace | ✅ Done |

**New features queued from PRD additions:**

| Feature | Name | Status |
|---|---|---|
| P1 | Detachable Panel System | Queued |
| C1 | ScriptFlora Coach | Queued |

---

## Full phase map

| Phase | Name | Horizon |
|---|---|---|
| 0 | Stabilize foundation | ✅ Done |
| 1 | Continuity core | ✅ Done |
| 2 | Shot-layer Director | ✅ Done |
| 3 | Media generation routing | ✅ Done |
| 4 | Assembly + export | ✅ Done |
| 5 | Autopilot with checkpoints | ✅ Done |
| 6 | Multi-episode / long-form memory | ✅ Done |
| 7 | Packs, social, team workspaces | ✅ Done |
| 8 | Marketplace readiness | ✅ Done |
| 9 | Upload draft → Brief | ✅ Done |
| 10 | Asset Library | ✅ Done |
| 11 | HyperFrames composition node | ✅ Done |
| S0 | Skill manifests foundation | ✅ Done |
| S1 | Skills Studio | ✅ Done |
| S2 | Team skill sharing | ✅ Done |
| S3 | Public marketplace | ✅ Done |
| P1 | Detachable Panel System | Next — 1–2 weeks |
| C1 | ScriptFlora Coach | After P1 — 2–4 weeks |

---

## Tutorials — How to use each implemented phase

These are practical guides for users and developers. Each phase maps to live nodes on the canvas.

---

### Tutorial: Phase 0 — Brief → Script → Export (Golden path)

This is the core loop. Everything else builds on it.

**Step 1 — Create or open a project**
Go to `/projects`, click "New project". You land on the canvas.

**Step 2 — Fill the Brief node**
The Brief node is the leftmost node. Fill in:
- Title / Topic (required)
- Objective (required)
- Audience
- Duration (required)
- Platform(s)
- Tone
- Key Facts — add each fact and press Enter. These are hard constraints the model will never violate.

**Step 3 — Confirm the Brief**
Click "Confirm Brief & unlock pipeline". This is a deliberate gate — the pipeline will not generate without it. If required fields are missing, you'll see a red error list.

**Step 4 — Select a skill**
On the Skill node, click "Choose a skill" and pick:
- **Standard Script** — Hook → Scenes → Dialogue → Visual Directions → CTA. Best for ads, training, and social.
- **Auteur Script** — 5-stage funnel (Stageplay → Screenplay → Technical Screenplay → Production Summary → Auteur Script). Best for films and continuity-heavy generation.

**Step 5 — Generate**
Click Generate in the top bar. The pipeline runs. Content nodes appear on the right.

**Step 6 — Review and lock**
- Edit any node's content directly.
- Click the Lock icon (or press `L` on keyboard) to lock a node — locked nodes are never overwritten by regen.
- Click Approve (✓) to mark a node approved.
- Click Regenerate (⟳) to regenerate a single node — it receives the full Brief and upstream context.

**Step 7 — Run continuity check**
Add a Continuity Checker node. Click "Run check". Issues appear as warnings — error (story-breaking), warning (possible issue), info (suggestion). Continuity check now passes the full brief context (tone, audience, platform) to the AI, not just key facts.

**Step 8 — Export**
On the Export node, choose format (Markdown is default), set a filename, and click "Export script". The file downloads immediately.

**Keyboard shortcuts:**
- `L` — lock selected nodes
- `U` — unlock selected nodes
- `A` — approve selected content nodes
- `⌘D` — duplicate selected nodes
- `F` — fit canvas view
- `Delete/Backspace` — delete selected (locked nodes are protected)
- `?` — show shortcut help

---

### Tutorial: Phase 1 — Character Bible + Style Lock

Set up the continuity core before generating any script or media.

**Character Bible node**

Add from sidebar → "Character Bible". For each character:
1. Click "Add character" — a card appears.
2. Fill name, role, goals, traits, visual description, wardrobe.
3. Expand "Voice profile" — fill voice ID, tone, style.
4. Upload or drag a reference image. The "Required before video" badge disappears when an image is present.
5. Click the Lock icon on the character card to lock that character. Locked characters gate video generation.

**World / Style Lock node**

Add from sidebar → "World / Style Lock":
1. Select medium (live-action / animation / hybrid).
2. Fill visual rules, locations, hard constraints.
3. When complete, click "Lock style rules — inject into all generations". This sets `status: approved` and the node injects its rules into every subsequent generation automatically.

**Continuity Log node**

Add from sidebar → "Continuity Log". After each scene is approved:
1. Click "Add scene entry".
2. Fill character entry/exit states, revealed facts, open threads, wardrobe changes.
3. This log is read by the continuity checker and injected into the generation context.

**How injection works:** When you click Generate, the canvas reads all locked Character Bible entries and the locked Style Lock and appends them to the generation prompt under "CHARACTER BIBLE" and "STYLE LOCK" sections. The model is instructed to enforce these on every scene.

---

### Tutorial: Phase 2 — Shot List + Storyboard + Sequence

Turn an approved script into generation-ready shot briefs.

**Shot List node**

1. Make sure you have at least one approved/draft content node on the canvas.
2. Add a "Shot List" node from the sidebar.
3. Click "Expand scene into shots". The node reads the best available script content node and calls `/api/expand-shots` — ChatGPT breaks the scene into individual shots with camera, action, dialogue, continuity notes, opening/ending state, and duration target.
4. Each shot card is collapsible. Review the details.
5. Click ✓ on a shot to approve it, ✗ to reject it.

**Storyboard Frame node**

1. Add a "Storyboard Frame" node. Set the shot label.
2. Upload a reference image (or leave blank and draw one by hand).
3. Click "Approve frame" — the frame locks and becomes a video generation reference.
4. Rejected frames clear the image slot for a new upload.

**Sequence node**

1. Add a "Sequence" node.
2. Click "Sync from Shot Lists" — it reads all Shot List nodes and builds an ordered list.
3. Use the ▲/▼ arrows to reorder shots.
4. Status dots show the state of each shot (pending → approved → generated).

---

### Tutorial: Phase 3 — Generate Shot + Result + Checkpoint

Generate media with the Runway model router under Director control.

**Setup**

Add your `RUNWAY_API_KEY` to `.env.local`:
```
RUNWAY_API_KEY=your-key-here
```
Without this key, the node returns a **simulated result** — the full UI works for testing without Runway credits.

**Generate Shot node**

1. Add from sidebar → "Generate Shot".
2. Select priority: Draft (fast/cheap), Balanced, or Final.
3. Check the shot type flags if applicable:
   - "Edit existing clip" → routes to Aleph 2.0
   - "Performance / acting shot" → routes to Act-Two (needs character ref)
   - "Native audio" → routes to Veo 3.1
4. The "Routed to" preview shows which model will be used.
5. "Estimated cost" shows credits before you generate.
6. Click "Generate shot". The node calls `/api/generate-shot`, passes locked character images and style lock automatically.

**Model routing logic:**
```
Edit of clip? → Aleph 2.0
Priority = draft? → Gen-4 Turbo
Performance shot? → Act-Two
Native audio? → Veo 3.1
Default → Gen-4.5
```

**Result node**

After generation, a Result node holds the clip + audio. It starts as `in_review`.
- Click "Approve" → moves to `approved`, usable downstream.
- Click "Reject" → fills a rejection reason textarea — this context is used in regen.
- Click "Generation provenance" to see model, cost, style lock version, timestamp, character refs.

**Checkpoint node**

1. Add a "Checkpoint" node after a batch of Result nodes.
2. Set "Required approvals" to the number of shots that must be approved before continuing.
3. Click "Sync approvals from canvas" — it counts all approved Result nodes automatically.
4. When the count is met, the gate opens. Click "Open manually" to override.
5. Add director notes for the next batch before continuing.

---

### Tutorial: Phase 4 — Timeline + Export Package

Assemble approved clips into a rough cut and hand off to an editor.

**Timeline node**

1. Add from sidebar → "Timeline".
2. Click "Sync approved results" — pulls all approved Result nodes in order, extracting video URLs, audio URLs, labels, and duration from their provenance.
3. Click ▶ to preview the rough cut. The player advances through clips automatically.
4. Reorder clips with ▲/▼ arrows.
5. Toggle the transition label between "Cut" and "Fade" between clips.

**Export Package node**

1. Add from sidebar → "Export Package".
2. Set a package name (e.g. `aperture-ep1-v1`).
3. Select your NLE target:
   - **DaVinci** → `.edl` marker file
   - **Premiere** → `.csv` marker file
   - **CapCut / Descript** → timecode marker list
4. Toggle what to include (script, Character Bible, Continuity Log, NLE markers).
5. Click "Export package". Each file downloads individually:
   - `CLIP_MANIFEST.json` — numbered shot list with durations and transitions
   - `script.md` — full script
   - `shot-list.md` — per-shot camera, action, duration
   - `character-bible.md` — all locked characters + Style Lock
   - `continuity-log.md` — per-scene thread log
   - `nle-markers.[ext]` — cut points for your editor
   - `README.txt` — import instructions

Import into your NLE: use `CLIP_MANIFEST.json` for clip order, import the NLE markers file, and apply the script/continuity docs as reference during the finishing cut.

---

### Tutorial: Phase 5 — Autopilot with checkpoints

Run multi-scene batch generation without losing Director control.

**Batch Planner node**

1. Add from sidebar → "Batch Planner".
2. Set "Shots per batch" (1–20, default 5).
3. Click "Propose" — ChatGPT reads your existing shot count and open continuity threads, then proposes the next N shots with rationale.
4. Review each proposed item — edit the label or rationale, approve (✓) or reject (✗) each one.
5. When satisfied, click "Approve plan — unlock generation". This gates the batch.
6. Click "Reset" to start over with a new proposal.

**Autopilot Dashboard node**

1. Add from sidebar → "Autopilot Dashboard".
2. Set checkpoint frequency: Every shot / Every scene / Every 5 shots / Every 10 shots.
3. Click "Start autopilot". The node begins syncing progress every 3 seconds.
4. **Progress bar** shows completed/total shots.
5. **Cost** accumulates from Result node provenance records.
6. **Open issues** counts Continuity Log entries with unresolved threads.
7. When a checkpoint threshold is hit, the status changes to "Checkpoint — review required" with a warning banner.
8. Review the batch, then click "Continue next batch" to proceed.
9. Use "Pause" to pause mid-run, "Resume" to continue, or the stop (■) button to end the run.

---

### Tutorial: Phase 6 — Multi-episode memory

Keep characters and story threads consistent across episodes.

**Episode Memory node** (one per episode boundary)

1. Add from sidebar → "Episode Memory".
2. Set the Series ID — a string that links all episodes (e.g. `aperture-series`). Must be the same across all episodes.
3. Set the episode number.
4. Click "Sync from Bible" to import all locked characters from the Character Bible node.
5. Expand each character card, fill:
   - Exit state — what happens to this character by episode end
   - Entry state (next ep) — how they should appear at the start of next episode
   - Wardrobe at end
6. Fill revealed facts, open threads, resolved threads, director notes for next episode.
7. Click "Save episode to series memory" — persists to `localStorage` under `sf:series:{id}`.

**Handoff to next episode:**
On the next episode's Episode Memory node:
1. Set the same Series ID.
2. Set episode number to N+1.
3. Click "Load exit states from episode N" — automatically pulls the previous episode's exit states into entry states for each character.

**Series Arc node** (one per series)

1. Add from sidebar → "Series Arc".
2. Fill series title, total episodes, current episode.
3. Add arc beats — each beat covers a range of episodes with label, status (planned/written/generated/complete), description, character milestones, open/resolved threads.
4. Track overarching themes and series-wide character arcs at the top.
5. The progress bar shows complete beats / total beats.

---

### Tutorial: Phase 7 — Packs, social, team

Make ScriptFlora feel native for your project type.

**Project Pack node**

1. Add from sidebar → "Project Pack".
2. Select the pack that matches your project:
   - **Ads / Commercials** — short shots, identity lock required, every-shot checkpoints
   - **Series / Episodic Drama** — series memory enabled, scene-level checkpoints
   - **Animation / Cartoon** — animation medium, character sheet enforced
   - **Educational / Training** — Standard skill default, scene checkpoints
   - **Hybrid** — mixed medium, 5-shot checkpoints
3. Click "Apply [Pack] defaults". This fires a `sf:pack:apply` canvas event that other nodes (Style Lock, Autopilot Dashboard) can listen to.

**Social Variants node**

1. Add from sidebar → "Social Variants".
2. Click "+ YouTube", "+ Instagram", "+ TikTok" etc. to add platform variants with preset aspect ratios and durations.
3. Edit the label for each variant.
4. Upload or describe a thumbnail for key art generation.
5. Mark each variant as exported when done.
6. Set a publish schedule (free text — e.g. "YouTube: Monday 9am UTC").

**Team Workspace node**

1. Add from sidebar → "Team Workspace".
2. Set workspace name and brand kit notes (colours, fonts, tone guidelines).
3. Toggle "Team approval required before export" if exports need sign-off.
4. Add comments — each has author name (optional), text, and a resolve/re-open toggle.
5. Comments are stored on the node and visible to anyone with access to the project.

---

### Tutorial: Phase 8 — Marketplace readiness (for developers)

This phase is transparent to end users but important for developers and skill authors.

**What was implemented:**
- Every skill-created node now carries `skillId`, `skillVersion`, `skillNodeKey`, `publisherId`, `origin: "skill"`
- Every system node carries `origin: "core"`
- Built-in skills (Standard, Auteur) run through `SKILL_MANIFESTS` in `lib/flow-types.ts`
- Skill versions are pinned on projects at creation time in `lib/store.ts`
- Every content node carries `contract: { reads, writes, sideEffects }`
- Unlocked skill nodes show `staleReason` badge when a skill update is available
- All continuity mutations must go through `POST /api/continuity/apply-patch`

**How to add a new built-in skill:**

1. Add a `SkillManifest` entry to `SKILL_MANIFESTS` in `lib/flow-types.ts`:
```ts
'my-skill': {
  skillId: 'scriptflora.my-skill',
  version: '1.0.0',
  publisherId: 'scriptflora',
  name: 'My Skill',
  tagline: 'What this skill does.',
  stages: '3 stages',
  source: 'builtin',
  promptFile: 'my-skill.md',
  nodes: [
    { key: 'intro', type: 'content', kind: 'hook', title: 'Introduction' },
    { key: 'body',  type: 'content', kind: 'scene', title: 'Body', dependsOn: ['intro'] },
    { key: 'close', type: 'content', kind: 'cta',   title: 'Close', dependsOn: ['body'] },
  ],
}
```
2. Add the skill prompt markdown to `public/skills/my-skill.md`.
3. The `SkillNode` component reads `SKILL_MANIFESTS` automatically — no other changes needed.

---

## Phase 9 — Upload draft → Brief ✅ Done

Users can upload a draft document (`.txt`, `.md`, `.pdf`, `.docx`) to the Brief node. The file content is sent to `/api/generate-brief` with `docText` mode. Extracted fields are flagged amber ("inferred") and the Confirm gate still requires explicit user action.

**What was built:** File upload input on Brief node, `docText` extraction mode in generate-brief route, `sourceFile` provenance field on `BriefNodeData`, amber assumption flags on extracted fields.

---

## Phase 10 — Asset Library ✅ Done

Project-level asset store for logos, overlays, audio beds, and template parts used in HyperFrames packaging.

**What was built:** `lib/assets.ts` (localStorage, per-project, base64 data URLs), `AssetLibrary` sidebar panel with upload, filter tabs, asset cards with preview + copyable ID, type/tag/license metadata. Explicitly separate namespace from Character Bible image refs.

---

## Phase 11 — HyperFrames composition node ✅ Done

Packages approved Timeline clips into designed, deliverable video using HeyGen HyperFrames — an HTML/CSS/JS → video framework.

**What was actually built (corrected from spec):**

HyperFrames is not a template engine — it turns real HTML compositions into video. The implementation is based on the real HyperFrames documentation (`hyperframes.mintlify.app`).

**Four real HTML composition templates** (`public/hyperframes-templates/`):
- `explainer_16x9` — title block, subtitle, CTA, logo, dark overlay, 1920×1080
- `ad_endcard_16x9` — video clips + CSS-animated end card with brand colour, 1920×1080
- `social_9x16` — safe-area bottom text, vertical, 1080×1920
- `training_module` — header bar, side panel, key fact callout, presenter credit, 1920×1080

Each template uses `data-composition-variables`, `window.__hyperframes.getVariables()`, and proper `data-start`/`data-duration`/`data-track-index` clip attributes. Clips from the Timeline node are passed as `_clips` JSON variable.

**Four API routes:**
- `POST /api/hyperframes/render` — loads template from disk, injects `_clips` variable, submits to HeyGen `POST /v3/hyperframes/renders` (auth: `X-Api-Key`) or `npx hyperframes render` (local CLI) or returns simulated task ID
- `GET /api/hyperframes/status?taskId=` — polls `GET /v3/hyperframes/renders/{render_id}`, normalises status, returns `video_url`
- `GET /api/hyperframes/preview?templateId=&variables=` — injects `window.__hyperframes.getVariables()` bootstrap and serves template HTML for iframe preview
- `GET /api/hyperframes/file?path=` — serves local CLI render output (only when `HYPERFRAMES_LOCAL=true`)

**HyperFrames node:** template picker, variable editor (title, subtitle, CTA, logoUrl, primaryColor, presenter + custom key/value), clip sync from Timeline, "Preview composition" iframe toggle (loads real template HTML with current variables), render button, status banner, approve/reject, provenance accordion.

**Local CLI path (opt-in):** `HYPERFRAMES_LOCAL=true` → `npx hyperframes render <dir> --output output.mp4 --variables '<json>'`. Template is copied to `/tmp/hf-renders/{taskId}/`, CLI runs async, status polls output directory for completed `.mp4` files.

### Environment variables

```bash
# HeyGen cloud rendering (POST /v3/hyperframes/renders)
HEYGEN_API_KEY=

# Local CLI rendering (opt-in alternative)
HYPERFRAMES_LOCAL=true    # set to use local CLI instead of cloud
HYPERFRAMES_CLI_BIN=      # default: "npx hyperframes"
HEYGEN_API_URL=            # default: https://api.heygen.com
```

---

## Phase S0 — Skill manifests foundation ✅ Done

**What was built:** Full `SkillManifest` schema with `permissions`, `requires`, `modelPreferences`, `packagingDefaults`, `changelog`. Permission catalog with 8 permission types. Three built-in skills with complete manifests (Standard, Auteur, Series). `requires.locks` validation in `handleGenerate` — blocks with a descriptive preflight error if declared locks are missing. Series skill prompt file at `public/skills/series-script.md`.

---

## Phase S1 — Skills Studio ✅ Done

**What was built:** `/app/skills` (skill list with family picker, status filter, create/archive/delete), `/app/skills/[id]` (5-tab editor: Manifest, Instructions, Recipe, Test run, Version), `/api/skills/test-run` (isolated sandbox — outputs marked `origin: test`, never touches real Continuity Log), `lib/skill-studio.ts` store.

---

## Phase S2 — Team skill sharing ✅ Done

**What was built:** `/app/skills/library` (installed skills with trust tier display, permission review, export/import), `lib/skill-library.ts` (install/uninstall/enable/disable, audit log, JSON export/import, permission validation per trust tier), `TeamLibraryClient` with two tabs (Installed + Audit log).

---

## Phase S3 — Public skills marketplace ✅ Done

**What was built:** `/app/marketplace` (browse/search/filter/sort), `/api/marketplace/feed` (built-in catalog with official + community skills), `lib/marketplace.ts` (types + client helpers), `MarketplaceClient` (search, family/tier/sort filters, skill cards with detail panel showing permissions, recipe, changelog, trust tier warning for community skills, install button with permission validation).

---

## Feature P1 — Detachable Panel System (queued)

**Goal:** Photoshop-style panels that can dock to edges OR detach as freely movable floating windows. Users can re-attach floating panels. Layout persists per user/project.

**Primary panels:**
1. Nodes Library (currently in floating sidebar — make it a proper panel)
2. Node Inspector / Properties (selected node details — new)
3. Later: Coach panel, Assets panel

### Core UX
- **Docked mode**: dock left, right, or bottom; resizable; collapse/expand
- **Floating mode**: detach via drag on header or "Detach" button; freely draggable; resizable; z-index stacking; double-click header to re-dock
- **Dock zones**: highlight target when dragging near edges; drop to dock
- Mobile: bottom sheet / drawer fallback (no free-float required)

### Panel state schema
```ts
type PanelLayout = {
  id: string
  mode: 'docked' | 'floating'
  dockSide?: 'left' | 'right' | 'bottom'
  position: { x: number; y: number }   // floating only
  size: { width: number; height: number }
  collapsed: boolean
  zIndex: number
}
```

### Actions
- [ ] `lib/panel-store.ts` — Zustand store for panel layouts, persist to localStorage
- [ ] `PanelShell` component — header with drag handle, Dock/Detach/Collapse controls, resize handles
- [ ] `DockZone` overlay component — show when dragging near edges
- [ ] `usePanelDrag` hook — pointer events for drag (mouse + touch), constrain to viewport
- [ ] `PanelPortal` — render floating panels in document body overlay (above canvas)
- [ ] Convert Nodes Library sidebar into a proper Panel (docked left by default)
- [ ] Build Node Inspector panel (docked right by default, shows selected node properties)
- [ ] Ensure drag-to-canvas from floating Nodes Library still works with React Flow
- [ ] Keyboard: focusable header controls (Detach, Dock, Collapse)
- [ ] Mobile: collapse to bottom drawer; no free-float

### Technical notes
- Floating panels render above React Flow via portal — do not block canvas interactions
- Dragging nodes from a floating Nodes Library to canvas must still trigger React Flow drop handlers
- Use pointer events (not mouse events) for touch support
- Bring panel to front on click (`zIndex` increment)
- Smooth position animation (CSS transition on dock/undock; no animation on drag)

### Exit criteria
1. Nodes Library docks left and detaches to float — users can drag it anywhere
2. Inspector docks right and detaches to float
3. Floating panel is freely draggable and resizable
4. Drop near edge shows dock zone highlight and re-docks
5. Layout survives page refresh (localStorage)
6. Canvas pan/zoom works when not interacting with panels
7. Collapse works in docked mode

---

## Feature C1 — ScriptFlora Coach (queued)

**Goal:** State-aware in-app tutor that teaches the Director method on the actual canvas while the user does real work. Not a generic chatbot — grounded in docs and live canvas state.

**Source:** `ScriptFlora_PRD_Coach.md`

### What Coach does
- Reads current project/canvas state (brief status, locks, skills, shots, credits)
- Answers questions grounded in product docs and Director-method rules
- Teaches through on-screen spotlight, step cards, and guided walkthroughs
- Proposes safe "do with me" actions — never silent credit spend
- Respects plan gates, credits, and continuity locks

### UI surfaces
- Top-bar **Coach** button + `Cmd/Ctrl + J` shortcut
- Collapsible right rail: chat thread, active checklist, Show me / Do with me / Skip / Docs actions
- On-canvas teaching layer: spotlight (dim + highlight), beacon pulse, floating step card
- Mobile: bottom sheet
- Panel System integration: Coach rail uses the P1 panel system (dock right by default, can float)

### Coach state snapshot
```ts
type CoachState = {
  plan: "free" | "creator" | "studio"
  route: string
  briefStatus: "empty" | "draft" | "generated" | "confirmed"
  characterImagesLocked: boolean
  styleLockPresent: boolean
  selectedSkillId?: string
  shotPlanExists: boolean
  approvedShotCount: number
  sequenceClipCount: number
  hyperframesStatus?: string
  directorCreditsRemaining?: number
  runwaySecondsRemaining?: number
  hasChatGPTLogin: boolean
  blockers: string[]
}
```

### Coach modes
| Mode | Behavior | Credit safety |
|---|---|---|
| Explain | Answer + optional doc link | None |
| Point / Show me | Spotlight UI + 1 instruction | None |
| Walkthrough | Multi-step checklist | None unless step requires confirm |
| Do with me | Propose → user confirms → execute | Explicit confirm required for any spend |

### First-run walkthrough (9 steps)
1. Welcome → create project
2. Fill Brief → confirm it
3. Select skill → run it (or explain gate)
4. Review nodes → lock one
5. Show production roadmap

### Top 5 priority coaching intents for MVP
1. `brief_unconfirmed` — skills disabled blocker
2. `character_before_video` — missing character images gate
3. `choose_skill` — Standard vs Auteur vs Series
4. `runway_credits_gate` — video generation blocked
5. `hyperframes_purpose` — "what does HyperFrames do?"

### Actions
- [ ] `lib/coach-state.ts` — collect and shape `CoachState` snapshot from canvas + store
- [ ] `/api/coach/chat` route — system prompt with Director method + docs context + state snapshot; uses ChatGPT proxy
- [ ] `CoachRail` component — chat thread, step cards, action buttons (integrates with P1 panel system)
- [ ] `CoachSpotlight` component — dim overlay with highlighted target, floating step card, beacon pulse
- [ ] `useCoachBlockers` hook — derives blockers from canvas state, fires proactive tips
- [ ] First-run walkthrough script (`first_directed_path`) — 9 steps
- [ ] Top 20 intent handlers (see PRD section 9)
- [ ] Plan/credit awareness strip in Coach rail
- [ ] `coachSettings` preference: full / important / off
- [ ] Mobile: bottom sheet mode for Coach

### Safety rules
1. No bypass of Confirm Brief or Checkpoint
2. No credit spend without explicit confirm
3. No false claims of Free video generation
4. No publishing skills without Studio test path
5. Do with me commands require `userConfirmed: true`

### Exit criteria
- Coach rail opens with state-grounded responses
- Spotlight works on Brief Confirm and Skill Selector nodes
- First-run walkthrough completable in 3–5 minutes
- Blocker tips fire for unconfirmed Brief and zero Runway credits
- Do-with-me requires confirm and cannot silent-charge
- Plan-aware messaging (Free vs Creator)
- Coach can be set to Important only / Off

---

---

## Cross-cutting requirements (all phases)

| Area | Rule |
|---|---|
| Auth | Login with ChatGPT as Director brain — never replaced |
| Human control | Lock, approve, reject, regenerate at every important gate |
| Cost visibility | Show estimated generation cost before every batch |
| Observability | Log briefs, model choices, continuity decisions for every generation |
| Provenance | Every clip traces back to script + brief + locks + character refs |
| Mobile | Review + approve checkpoint flows must work on phone |
| Test path | One golden short-film path must keep working across all phases |
| Security | Tokens never reach the browser; all AI calls proxied server-side |
| Skill safety | Skills cannot replace core nodes; continuity only via API |

---

## Core vs skill node ownership (non-negotiable)

| Owned by system (core) | Skill may generate/propose |
|---|---|
| Brief node + confirm gate | Draft brief content |
| Character Bible | Character suggestions (human locks) |
| Style Lock | Style Pack drafts |
| Continuity Log | Patches via `continuity.applyPatch` only |
| Generate Shot + router entry | Model preference hints |
| Checkpoint | — |
| Sequence shell | Ordered clip suggestions |
| HyperFrames node | Template defaults / variable maps |

---

## What not to build (stay disciplined)

- One-click 1-hour movies — not promised, not architected
- Whole-scene single video calls — shots only, then assemble
- Let models invent character or plot without Director + Bible — never
- Skip human checkpoints on long runs — mandatory
- A full NLE inside ScriptFlora before assembly basics work
- New dependencies if an installed one covers the need
- Marketplace UI, payments, or publisher accounts before S0–S1 permission systems are solid
- Arbitrary third-party JavaScript execution in skill runtime (v1)
- Style/packaging skills replacing Style Lock or core continuity nodes

---

## Success signals by horizon

| Horizon | Signal |
|---|---|
| ✅ Now (Phases 0–S3) | Full stack — canvas, skills, marketplace, HyperFrames — compiling cleanly |
| 1–2 weeks (P1) | Detachable panel system — Nodes Library and Inspector dock + float |
| 2–4 weeks (C1 MVP) | Coach rail opens, spotlight works, first-run walkthrough completable |
| 1 month (C1 v1.1) | Do-with-me actions, Skills Studio mini-walkthrough, HyperFrames packaging walkthrough |

---

## Environment variables reference

```bash
# Required for all AI features
LWC_SECRET=your-lwc-secret-here

# Required for Phase 3 video generation (Runway)
# Without this key, generate-shot returns a simulated result
RUNWAY_API_KEY=

# Phase 11 — HeyGen HyperFrames packaging (cloud path)
# Auth header: X-Api-Key on POST /v3/hyperframes/renders
# Without this key, hyperframes/render returns a simulated result
HEYGEN_API_KEY=
# Alias: HYPERFRAMES_API_KEY also works (same credential)

# Phase 11 — Local CLI rendering (opt-in alternative to cloud)
# Set to "true" to use `npx hyperframes render` instead of HeyGen cloud
# Requires: npm install -g hyperframes (or npx works without install)
HYPERFRAMES_LOCAL=
HYPERFRAMES_CLI_BIN=       # default: "npx hyperframes"
HEYGEN_API_URL=            # default: https://api.heygen.com

# Public marketplace feed URL (Phase S3)
# Default: /api/marketplace/feed (built-in catalog)
# Set for a live CDN feed in production
NEXT_PUBLIC_MARKETPLACE_FEED_URL=
```

---

## Node quick-reference

All nodes available from the sidebar library (drag to canvas or click to place):

| Node | Phase | Purpose |
|---|---|---|
| Brief | 0 | Project intake, key facts, confirm gate |
| Skill Selector | 0 | Choose pipeline (Standard, Auteur, custom) |
| Character Bible | 1 | Character identity, image lock, voice profile |
| World / Style Lock | 1 | Visual rules, medium, hard constraints |
| Continuity Log | 1 | Per-scene character states + thread tracking |
| Shot List | 2 | Expand scene → ordered shots with briefs |
| Storyboard Frame | 2 | Key-frame image per shot, approve/reject |
| Sequence | 2 | Ordered shot skeleton (no media yet) |
| Generate Shot | 3 | Runway model router, cost estimate |
| Result | 3 | Clip + audio + provenance, approve/reject |
| Checkpoint | 3 | Human gate before next batch |
| Timeline | 4 | Rough-cut preview, reorder clips |
| Export Package | 4 | Full handoff package for NLE |
| Batch Planner | 5 | Director proposes next N shots |
| Autopilot Dashboard | 5 | Progress, cost, checkpoint frequency |
| Episode Memory | 6 | Exit/entry state handoff between episodes |
| Series Arc | 6 | Season arc beats, character milestones |
| Project Pack | 7 | Medium-specific defaults |
| Social Variants | 7 | Platform cuts, captions, publish schedule |
| Team Workspace | 7 | Comments, approvals, brand kit |
| Continuity Checker | 0 | Cross-scene consistency check |
| Multi-Format Output | 0 | Download screenplay / shotlist / social cuts |
| Export | 0 | Markdown / PDF / Final Draft export |
| HyperFrames | 11 | Packaging composition — HTML templates, HeyGen cloud or local CLI |

> **P1 (next):** Panel system will convert the Nodes Library into a proper dockable/floating panel and add a Node Inspector panel.  
> **C1 (after P1):** Coach rail will appear as a panel (dock right by default, can float).

---

## Positioning

**ScriptFlora is the Director's desk for AI film.**

ChatGPT plans and protects continuity.  
Video and voice models execute under orders.  
Humans approve the moments that matter.  
Characters are locked as images before motion begins.  
Storyboards guide key shots.  
Skills extend the pipeline — safely, with declared permissions.  
HyperFrames packages the approved cut into a designed deliverable.  
Long-form is assembled from controlled batches — not wished into existence.

---

*End of ScriptFlora Action Plan v5.0*
