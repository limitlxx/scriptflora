# ScriptFlora — Upgrade Action Plan
**The Director's Desk for AI Film**

> Version 5.0 | Updated from PRD v3.2 + Skills Studio/Marketplace PRD + HyperFrames Feature Doc  
> Status: Active roadmap — Phases 0–8 implemented, Phases S0–S3 + HyperFrames queued  
> Core principle: Create with AI. Review with humans.

---

## What This Document Is

Single source of truth for building ScriptFlora from its current foundation into a full Director's desk for AI film. Every implemented phase is marked. Every future phase has actionable tasks. New phases from PRD v3.2 (HyperFrames, Skills Studio, Marketplace) are integrated.

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
| 0 | Stabilize foundation | ✅ Implemented |
| 1 | Continuity core (Character + World + Voice) | ✅ Implemented |
| 2 | Shot-layer Director | ✅ Implemented |
| 3 | Media generation routing (Video + Voice) | ✅ Implemented |
| 4 | Assembly + export | ✅ Implemented |
| 5 | Autopilot with checkpoints | ✅ Implemented |
| 6 | Multi-episode / long-form memory | ✅ Implemented |
| 7 | Packs, social, team workspaces | ✅ Implemented |
| 8 | Marketplace readiness (node substrate) | ✅ Implemented |

**New phases from PRD v3.2 and feature docs:**

| Phase | Name | Status |
|---|---|---|
| 9 | Upload draft → Brief | Queued |
| 10 | Asset Library (motion graphics) | Queued |
| 11 | HyperFrames composition node | Queued |
| S0 | Skill manifests foundation | Queued |
| S1 | Skills Studio (internal authoring) | Queued |
| S2 | Team skill sharing | Queued |
| S3 | Public skills marketplace | Queued |

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
| 8 | Marketplace readiness (node substrate) | ✅ Done |
| 9 | Upload draft → Brief | PENDING |
| 10 | Asset Library | In progress (data layer done) |
| 11 | HyperFrames composition node | PENDING |
| S0 | Skill manifests foundation | Parallel with Phase 9 |
| S1 | Skills Studio (internal) | After S0 |
| S2 | Team skill sharing | After S1 |
| S3 | Public marketplace | After S2 |

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

## Phase 9 — Upload draft → Brief (queued)

**Goal:** Let users start from a rough document (notes, PDF, email, script draft) instead of a blank form.

### New capabilities
- Upload control on the Brief node (txt / md / pdf)
- Extract fields via ChatGPT + Brief Generator
- Assumption flags for fields that were inferred
- Source file stored as Brief provenance
- Explicit Confirm gate still required after extraction

### Actions
- [ ] Add file upload input to Brief node (txt, md, pdf)
- [ ] POST upload content to `/api/generate-brief` with mode `extract`
- [ ] Extend `generate-brief` route to handle raw document text
- [ ] Flag extracted fields with `assumedField` indicators (amber border)
- [ ] Store original file name as `provenance.sourceFile` on Brief data
- [ ] Confirm gate still required — never auto-confirm after upload

### Exit criteria
- User uploads a 1-page brief doc and gets a structured Brief in under 10 seconds
- All inferred fields are flagged before confirm

---

## Phase 10 — Asset Library (in progress)

**Goal:** Store logos, overlays, end cards, audio beds, and fonts for use in HyperFrames packaging.

### New capabilities
- Project-level asset library (file upload + metadata)
- Asset types: brand/overlay/audio/template_part
- Assets available to HyperFrames templates and brand kits
- No auto-injection into generative shot prompts (explicitly not)

### Actions
- [x] Data layer — `lib/assets.ts`: `loadAssets`, `saveAssets`, `deleteAsset`, `getAssetById`, `fileToAsset` (localStorage + base64 data URLs; upgrade path noted for cloud storage)
- [x] Build Asset Library sidebar panel (project-scoped)
- [ ] Support upload of PNG, SVG, MP3, MP4 (short loops), TTF
- [ ] Metadata: name, type tag, license notes
- [ ] Assets addressable by ID (used by HyperFrames variable bindings)
- [ ] Separate asset refs from Character Bible image refs — different namespaces

### Exit criteria
- User can upload a brand logo and reference it by ID in HyperFrames templates
- Assets are stored per-project in localStorage/blob (upgrade path: cloud storage)

---

## Phase 11 — HyperFrames composition node (queued)

**Goal:** Compose approved Sequence media into designed, deliverable video packages using HeyGen HyperFrames.

### What HyperFrames does vs what generative models do

| Layer | Tool | Purpose |
|---|---|---|
| Shot generation | Runway / Veo / Seedance | Create the raw clips |
| Assembly | Timeline node | Order clips, rough cut |
| **Packaging** | **HyperFrames node** | Titles, captions, branding, platform layouts |
| Finishing | External NLE | Sound design, grade, music |

HyperFrames does not replace generative models. It finishes the cut.

### New node: HyperFrames

**Inputs:**
- Upstream Sequence (ordered clips + audio)
- Script text / captions (optional)
- Style Lock / brand kit (optional)
- Template ID
- Aspect ratio targets
- Variables (title, CTA, logo URL, colours)

**Outputs:**
- Composition bundle (HTML/CSS/assets)
- Rendered video per aspect ratio
- Preview thumbnail
- Provenance record (template, variables, source clip IDs, render IDs)

**V1 templates:**
- `explainer_16x9` — narrated explainer with titles
- `ad_endcard_16x9` — short ad with end card / CTA
- `social_9x16` — vertical social with safe margins and captions
- `training_module` — lesson segment with section titles and key facts

**Rendering paths:**
- **HeyGen Cloud** (default): POST composition bundle to HeyGen Rendering API, poll for result
- **Local CLI** (opt-in): `hyperframes check` → `hyperframes render`

### Actions
- [ ] Add `HyperFramesNodeData` type to `flow-types.ts`
- [ ] Build `hyperframes-node.tsx` with template picker, variable editor, clip mapping, render controls
- [ ] Build `/api/hyperframes/render` route — build composition bundle, call HeyGen API
- [ ] Build `/api/hyperframes/status?taskId=` polling route
- [ ] Store provenance on result: template, variables, source clip IDs, render IDs
- [ ] Add `HEYGEN_API_KEY` to `.env.local`
- [ ] Human approve/reject before package is marked export-ready
- [ ] Wire into canvas, menu, sidebar

### Exit criteria
- User picks a template, maps clips from Sequence, sets variables, renders a draft
- Rendered output previews in the node
- Approved HyperFrames output is included in Export Package
- Failure states are visible and retryable

---

## Phase S0 — Skill manifests foundation (queued)

**Goal:** Finalize the manifest schema, migrate built-in skills, lock provenance and pinning.

This phase is already partially done (Phase 8). What remains:

### Actions
- [ ] Finalize `SkillManifest` JSON schema including `permissions`, `requires`, `modelPreferences`, `packagingDefaults`
- [ ] Add `permissions` catalog to manifests: `read:brief`, `read:bible`, `read:style`, `write:skill_nodes`, `write:continuity_patch`, `suggest:model_route`, `suggest:packaging`
- [ ] Migrate Standard, Auteur, Series skills to full manifest format
- [ ] Validate skill can declare `requires.locks` and block if missing (e.g. requires Style Lock)
- [ ] Changelog field on manifest (required for publish later)

### Exit criteria
- All built-in skills have valid full manifests
- A skill can declare required inputs and the canvas surfaces a clear error when they're missing

---

## Phase S1 — Skills Studio (ScriptFlora Studio) — internal authoring (queued)

**Goal:** First-party skill authoring with isolated test runs.

### New surfaces
- **Skill list** — drafts, published, archived skills
- **Manifest editor** — family, version, permissions, required inputs
- **Instructions editor** — Director system/prompt logic
- **Recipe builder** — node types, order, dependencies, defaults
- **Test runner** — sandbox canvas execution (outputs marked `origin: test`)
- **Version manager** — semver, changelog

### Skill families supported
| Family | Example outputs |
|---|---|
| Script | Scenes, dialogue, macro-states |
| Style | Style Pack draft, visual constraints |
| Structure | Beat/act templates, format defaults |
| Packaging | HyperFrames template preferences |
| Domain | Training modules, theater scene study |

### Actions
- [ ] Build `/app/skills` route — skill list view
- [ ] Build manifest editor form (family, inputs, permissions, version)
- [ ] Build recipe builder (node type list with deps and defaults)
- [ ] Build test runner — ephemeral project, isolated continuity (no real log writes)
- [ ] Test outputs marked `origin: "test"` — never persist to real project
- [ ] Version save + immutable after publish

### Safety rules
- Test runs cannot write to real project Continuity Log
- Core nodes cannot be in a skill's recipe as system nodes
- Permissions must be declared before runtime access is allowed

### Exit criteria
- Internal author can create a skill, define recipe, run test, save version
- Test project spawns expected nodes with correct provenance
- Test run cannot mutate real continuity state

---

## Phase S2 — Team skill sharing (queued)

**Goal:** Team members can install and share skills within a workspace.

### Actions
- [ ] Team library: skills visible to all workspace members
- [ ] Author roles: team admin can designate approved authors
- [ ] Install flow: browse → review permissions → install to library → pin to project
- [ ] Audit log for install/uninstall/permission grants
- [ ] Skill update notification (non-destructive — doesn't auto-change pinned projects)

### Trust tiers
| Tier | Meaning |
|---|---|
| Official | ScriptFlora first-party |
| Verified | Reviewed publisher |
| Community | Available but labeled; limited permissions |

---

## Phase S3 — Public skills marketplace (queued)

**Goal:** Open discovery, install, and optional commerce for third-party skills.

**Do not open until S0–S2 quality and permission systems are stable.**

### Actions
- [ ] Browse/search by family and trust tier
- [ ] Skill detail page: description, permissions list, screenshots, changelog, publisher
- [ ] Verified publisher program
- [ ] Install/uninstall from marketplace
- [ ] Optional commerce layer (free / one-time / subscription share) — not required for launch
- [ ] Permission overreach detection and rejection

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
| ✅ Now (Phases 0–8) | Full node canvas — Brief through team workspace — compiling cleanly |
| 1–2 weeks (Phase 9–10) | Upload draft → Brief in < 10s; Asset Library for brand files |
| 3–4 weeks (Phase 11) | HyperFrames node packaging approved clips into designed deliverables |
| 6–8 weeks (S0–S1) | Internal skills authored, tested, and versioned in Skills Studio |
| 3 months (S2) | Team skill sharing with permission review and audit |
| Later (S3) | Public marketplace with verified publishers and trust tiers |

---

## Environment variables reference

```bash
# Required for all AI features
LWC_SECRET=your-lwc-secret-here

# Required for Phase 3 video generation (Runway)
# Without this key, generate-shot returns a simulated result
RUNWAY_API_KEY=

# Required for Phase 11 HyperFrames packaging (HeyGen)
# Without this key, hyperframes-node will need local CLI path
HEYGEN_API_KEY=
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
| HyperFrames | 11 | Packaging composition (queued) |

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
