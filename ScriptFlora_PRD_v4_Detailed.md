# Product Requirements Document (PRD)
## ScriptFlora — Director’s Desk for AI Film

**Version:** 3.2  
**Status:** Active development roadmap  
**Lineage:** 10Alytics AI BuildFest → Film Production Platform  
**Core principle:** Create with AI. Review with humans.  
**Changelog (3.2):** Added Appendix B — Extended Nodes & Skill Families (HyperFrames, Brief upload, Assets, Skills Studio, Asset→Skill conversion; non-script skill types).

---

## 1. Document Control

| Item | Detail |
|------|--------|
| Product name | ScriptFlora |
| Vision | The Director’s desk for AI film (ads, series, movies, animation, educational film) |
| Director / Brain | ChatGPT via Login with ChatGPT |
| Crew | Routed video models + voice/TTS models |
| UI paradigm | Node-based canvas (React Flow) |
| Continuity model | Character Bible, World/Style Lock, Continuity Log |
| Auth | Login with ChatGPT (own subscription) |

---

## 2. Vision

ScriptFlora helps creators and teams turn ideas into structured, continuity-safe scripts and then into directed media — without losing human control.

- **ChatGPT** acts as the Director: plans, structures, protects continuity, writes generation briefs.
- **Video and voice models** act as the crew: execute only under strict instructions and references.
- **Humans** approve the moments that matter.

Long-form work is produced by batch generation + checkpoints + assembly, not by one-shot generation.

---

## 3. Problem Statement

Creative teams struggle with:

- Incomplete briefs and slow script structuring
- Weak continuity across scenes and episodes
- AI writing tools that stop at flat text
- AI video tools that lack story control and identity lock
- Expensive, fragmented revision cycles
- No single system connecting story → script → shots → media → assembly

ScriptFlora connects writing intelligence and media generation under one Director model.

---

## 4. Goals

### Primary goals
- Remain best-in-class for controlled script workflows
- Add continuity core (Character, World, Voice)
- Derive shots/storyboards from approved scripts
- Route video + voice generation under Director control
- Support human checkpoints and rough-cut assembly
- Scale toward series and longer-form work

### Non-goals (near term)
- One-click 1-hour movies
- Fully automatic long-form without human review
- Building a full professional NLE inside the app

---

## 5. Target Users

| User | Primary needs |
|------|----------------|
| Scriptwriters & content teams | Structure, fast revision, multi-format export |
| Educators / training teams | Clear explainers and serial learning content |
| Marketing / ad teams | Controlled short films and platform variants |
| Indie filmmakers & series creators | Continuity, character lock, directed generation |
| Agencies | Shared control, brand consistency, approvals |

---

## 6. Core Principles

1. **Script-first** — Skills generate the source of truth; media follows the script
2. **Continuity is enforced** — Character, world, facts, and states persist
3. **Small units** — Generate shots/macro-states, not whole films
4. **Human checkpoints** — Required for quality and trust
5. **Own AI subscription** — Login with ChatGPT as the Director brain
6. **Exportable** — Always allow handoff to professional editors
7. **Images before motion for identity** — Characters and key boards before video

---

## 7. Image & Media Generation Rules (Critical)

### 7.1 Characters → Images first (required)

Character Design must produce visual references before serious video generation.

**Flow:**
```
Character Bible (text)
    → Generate character sheet / reference images
    → User approves and locks references
    → Every later shot uses locked images + text description + voice profile
```

**Why:** Video models need identity anchors. Without locked character images, face/wardrobe drift is inevitable.

### 7.2 Storyboard → Text plan first, images for key shots (recommended)

| Step | Output | Required? |
|------|--------|-----------|
| A. Shot plan | Text/node list derived from script | Required |
| B. Storyboard frames | Still images for key shots | Strongly recommended |

Generate frames especially for:
- Establishing shots
- Character introductions
- Key emotional beats
- Continuity-sensitive moments

**Flow:**
```
Approved script
    → Shot / macro-state plan (text)
    → Storyboard stills for key shots
    → User approves frames
    → Video generation uses: script beat + board frame + character refs
```

### 7.3 Scenes → Not full scene images first

Scenes are containers from the script. They are broken into shots.

```
Scene (from skill-generated script)
    → Shots / macro-states
    → Optional storyboard stills
    → Video clips per shot
```

A mood/reference plate for a scene is optional. A single “whole scene image” is not the generation source.

### 7.4 Canonical order

```
1. Brief (text)
2. Character Bible (text) → Character images (lock)
3. Style / World Lock (text) → optional style plates
4. Script from skills (text nodes)
5. Shot plan from script (text)
6. Storyboard stills for key shots (images)
7. Video + voice per shot (media)
8. Assembly
```

---

## 8. Current Foundation (Already Built)

| Capability | Status |
|------------|--------|
| Login with ChatGPT | Live |
| Brief Intake + Brief Generator | Live / in progress |
| Skill pipelines (Standard, Auteur, Series Structure) | Live |
| Node canvas (React Flow) | Live |
| Section lock / regenerate | Live |
| Key facts + basic continuity checks | Live |
| Multi-format script export | Live |
| Product identity (grey/silver) + pitch materials | Live |

---

## 9. End-to-End App Flow (Script-First)

```
Project type selected
    ↓
Brief (manual or generated) → Confirm
    ↓
Character Bible + Style/Voice Lock → Character images → Lock
    ↓
Skill pipeline (Standard / Auteur / Series)
    ↓
Structured script nodes → Review / Lock
    ↓
Shot / Storyboard plan derived from script
    ↓
Key storyboard stills (optional but recommended)
    ↓
Generate batch (Video + Voice) via Router
    ↓
Human checkpoint (Approve / Reject / Regen)
    ↓
Sequence assembly (rough cut)
    ↓
Export package and/or continue next episode
```

**Hard rule:** Media generation never precedes an approved script path.

---

## 10. Phase Mapping (Detailed)

### Phase 0 — Stabilize Foundation
**Goal:** Make the current script system reliable.

**Scope**
- Harden Brief + Brief Generator
- Skill stability (Standard, Auteur, Series)
- Lock/regen reliability
- Text continuity / fact checker
- Export quality
- Tester feedback loop

**Exit criteria**
- Stable idea → brief → script → export path
- Section regen respects locks and brief

**Pitch items:** Foundation only

---

### Phase 1 — Continuity Core (Character Design)
**Goal:** Persistent identity for people, world, and voice.

**Scope**
- Character Bible node
  - Traits, role, goals
  - Visual description
  - Wardrobe / signatures
  - Reference image generation + upload
  - Voice profile
- World / Style Lock node
  - Medium: live-action / animation / hybrid
  - Visual rules, palette, locations, constraints
- Continuity Log
  - Character entry/exit states
  - Revealed facts, open threads
- Inject Bible + Style into all relevant generations

**Exit criteria**
- Characters remain consistent across scenes/episodes
- Locked character images exist before video generation is allowed for that character
- Style rules are enforced in prompts

**Pitch items advanced**
- Character Design
- Episodes & Series (foundation)

---

### Phase 2 — Storyboard & Shot Layer
**Goal:** Turn approved scripts into generation-ready plans.

**Scope**
- Shot / Macro-State expander from script nodes
- Storyboard / shot plan view
- Generation brief per shot:
  - Camera, action, dialogue
  - Continuity notes
  - Opening state → ending state
  - Voice lines + character tags
- Key-frame storyboard image generation
- Sequence skeleton (ordered shots, no media yet)

**Exit criteria**
- From an approved script, user gets a clean shot plan
- Key shots can have approved still frames
- Shots inherit Character + Style locks

**Pitch items advanced**
- Storyboard
- Video Generation (preparation)

---

### Phase 3 — Video + Voice Generation
**Goal:** Execute shots with routed models under Director control.

**Scope**
- Model Router (video + TTS/voice)
- Generate Shot node
- Dialogue audio path from script + voice profile
- Optional lip-sync where mouth is clearly visible
- Result nodes with full metadata (brief, refs, model, continuity snapshot)
- Mandatory review status before downstream use
- Initial Image & Asset support (references, simple key art)

**Exit criteria**
- User can generate a batch of shots with picture + dialogue audio
- Regenerations keep continuity context
- Character image refs are passed into video calls

**Pitch items advanced**
- Video Generation
- Image & Asset Studio (initial)

---

### Phase 4 — Assembly & Export
**Goal:** Join approved media into a rough cut and hand off cleanly.

**Scope**
- Sequence / Timeline node
- Basic ordering, cut points, audio alignment
- Rough-cut preview
- Export package:
  - Numbered clips
  - Aligned audio
  - Script + shot list
  - Character Bible + Style snapshot
  - Continuity Log
  - Markers for external NLEs

**Exit criteria**
- Rough cut possible inside ScriptFlora
- Export usable in CapCut / Premiere / DaVinci / Descript

**Pitch items advanced**
- Enables all downstream finishing workflows

---

### Phase 5 — Autopilot with Checkpoints
**Goal:** Scale length without losing control.

**Scope**
- Batch planner (Director proposes next N shots/scenes)
- Autopilot runs with scheduled human checkpoints
- Pause / approve / regenerate / continue
- Progress and cost visibility

**Exit criteria**
- Multi-scene runs possible with enforced review gates
- Continuity issues surface at checkpoints

**Pitch items advanced**
- Autopilot Mode

---

### Phase 6 — Multi-Episode / Long-Form Memory
**Goal:** Series continuity that can assemble toward longer works.

**Scope**
- Persistent memory across episodes
- Exit state → next entry state
- Season/film arc tracking
- Assemble episodes/acts into longer sequences

**Exit criteria**
- Multiple episodes stay continuity-safe
- Longer pieces can be assembled from episodic units

**Pitch items advanced**
- Episodes & Series (full)

---

### Phase 7 — Packs, Social, Team
**Goal:** Medium-specific systems and collaboration.

**Scope**
- Packs: Ads, Series, Animation, Educational, Hybrid
- Image & Asset Studio expansion (thumbnails, key art, stills)
- Social Connections (captions, platform cuts, schedules)
- Team Workspaces (shared projects, comments, approvals, brand kits)

**Exit criteria**
- Specialized workflows feel native
- Agency-style collaboration is possible

**Pitch items advanced**
- Image & Asset Studio (full)
- Social Connections
- Team Workspaces

---

## 11. Pitch Item → Phase Map

| Pitch item | Phase |
|------------|-------|
| Character Design | Phase 1 |
| Storyboard | Phase 2 |
| Episodes & Series | Phase 1 foundation → Phase 6 full |
| Video Generation | Phase 3 |
| Image & Asset Studio | Phase 3 initial → Phase 7 full |
| Autopilot Mode | Phase 5 |
| Social Connections | Phase 7 |
| Team Workspaces | Phase 7 |

---

## 12. Functional Requirements by Domain

### Brief & Skills
- Generate and edit structured briefs
- Run Standard, Auteur, Series skills
- Lock/regenerate nodes with full context
- Script remains source of truth for all media

### Continuity
- Character Bible with visual + voice identity
- Character reference images required before video for that character
- World/Style Lock
- Continuity Log across scenes/episodes

### Direction & Planning
- Derive shots from approved script
- Optional key storyboard stills
- Maintain ordered sequence skeleton

### Generation
- Route video and voice models
- Generate per shot with references and constraints
- Store results with provenance

### Review & Assembly
- Checkpoint gates
- Rough timeline assembly
- Export for external finishing

### Collaboration & Distribution (later)
- Shared workspaces
- Social variants and publishing aids

---

## 13. Non-Functional Requirements

- Director calls use Login with ChatGPT path
- Structured outputs for briefs, shots, continuity
- Cost estimates before expensive batches
- Mobile-capable review/approve flows
- Traceability: every clip links back to script + brief + locks + character refs
- Locked items are not overwritten unless explicitly unlocked

---

## 14. Success Metrics

| Horizon | Signal of success |
|---------|-------------------|
| Near term | Reliable script workflows + tester retention |
| Mid term | Directed shorts (3–12 min) with video + voice under checkpoints |
| Later | Multi-episode continuity + rough-cut export used in real projects |

---

## 15. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Continuity drift in video | Character/Style locks + character images first + short shots + checkpoints |
| Cost blowups | Batch estimates + approval before run |
| Scope creep into full NLE | Rough-cut only; export to real editors |
| Autopilot quality collapse | Mandatory scheduled human gates |
| Script ignored by media stage | Hard dependency: shots derived from approved script only |
| Identity drift | Character images locked before generation |

---

## 16. Near-Term Build Order

1. **Phase 0** — Harden current script system  
2. **Phase 1** — Character Bible + images + Style + Voice  
3. **Phase 2** — Shot/Storyboard from script  
4. **Phase 3** — First video + voice path  
5. **Phase 4** — Assembly + export  
6. **Phase 5+** — Autopilot, multi-episode memory, packs, social, team  

---

## 17. Positioning Statement

**ScriptFlora is the Director’s desk for AI film.**

ChatGPT plans and protects continuity.  
Video and voice models execute under orders.  
Humans approve the moments that matter.  
Characters are locked as images before motion.  
Storyboards guide key shots.  
Long-form is assembled from controlled batches — not wished into existence.

---

## 18. Appendix A — Current Script Skill Stack

| Skill | Role |
|-------|------|
| Standard Script | Clean structured scripts for education, ads, training |
| Storyline Auteur Script | Dialogue-heavy, spatially continuous, generation-ready macro-states |
| Series Script Structure | Season arcs, episode maps, multi-episode continuity planning |

Media stages consume the outputs of these skills; they do not replace them.

---

## 19. Appendix B — Extended Nodes & Skill Families

**Status:** Proposed additions for product expansion  
**Principle:** Skills can extend beyond scripts. Core continuity nodes remain system-owned.

### B.1 Skill families (not only script skills)

A **skill** is any reusable Director pipeline that can declare inputs, spawn nodes, write structured outputs, and optionally prefer models/templates.

| Skill family | Examples | Typical outputs |
|--------------|----------|-----------------|
| **Script** | Standard, Auteur, Series | Script / scene / macro-state nodes |
| **Style / look** | Noir Pack, Documentary Realism, Kids Explainer Look | Style Lock draft, visual constraints, reference set |
| **Structure** | Ad 30s, Lesson module, Trailer structure | Beat/act templates |
| **Packaging** | Social cut package, Festival deliverable | HyperFrames defaults, caption rules |
| **Domain** | Theater scene study, Training module, Product demo | Domain-specific node graphs |

**Rule:** Skills may *propose* Style Locks, plans, and packages.  
**Core nodes** (*Brief, Character Bible, Style Lock, Continuity Log, Sequence, Generate Shot, Checkpoint, HyperFrames*) *own* enforcement and approvals.

Style Lock remains a core system node (world/look identity). A style skill can generate or refine a Style Pack that feeds Style Lock; it does not replace the lock.

---

### B.2 Feature: Upload Draft Idea → Brief Node

| Item | Detail |
|------|--------|
| Type | Enhancement to existing Brief node |
| Phase | 0 / 1 |
| Purpose | Convert rough notes/docs into structured Brief with human review |

**Flow**
```
Upload draft (txt/md/pdf/notes)
  → Extract fields and/or Brief Generator
  → Review assumptions
  → Confirm Brief
  → Skills unlock
```

**Requirements**
- Upload control on Brief node
- Field extraction + optional Generate Brief from upload
- Assumption flags retained
- Explicit Confirm still required
- Source file stored as Brief provenance

---

### B.3 Feature: Assets Upload for Motion Graphics

| Item | Detail |
|------|--------|
| Type | Asset Library + references |
| Phase | 4 / 7 (with HyperFrames) |
| Purpose | Store logos, overlays, end cards, fonts, music beds for packaging |

**Flow**
```
Upload assets → Tag (brand/overlay/audio/template_part)
  → Available to Brand Kit + HyperFrames
  → Optional Sequence overlays later
```

**Requirements**
- Project-level asset library (user-level later)
- Metadata: type, tags, license notes
- HyperFrames templates bind to asset ids
- Motion-graphic assets are not Character Bible identity refs
- No silent auto-injection into generative shot prompts

---

### B.4 Feature: HyperFrames Node

| Item | Detail |
|------|--------|
| Type | Core assembly / packaging node |
| Phase | 4 / 7 |
| Purpose | Compose approved Sequence media into designed video packages (HTML→video) |

**Flow position**
```
Sequence (approved) → HyperFrames → Preview/checkpoint → Export variants
```

**Requirements**
- Template picker (explainer, ad, social, training)
- Auto-map clips/audio/captions from Sequence
- Bind brand assets and variables
- Draft/final render (HeyGen Cloud first; local later)
- Provenance: template, variables, render ids, source clip ids
- Human approve before export-ready
- Does not replace generative shot models
- Does not mutate Character Bible / Continuity Log

**v1 templates:** `explainer_16x9`, `ad_endcard_16x9`, `social_9x16`, `training_module`

---

### B.5 Feature: Skills — Create and Test

| Item | Detail |
|------|--------|
| Type | Skills Studio + sandbox canvas |
| Phase | After skill manifests + version pinning |
| Purpose | Author, version, and safely test skills before install |

**Flow**
```
Skills Studio → Manifest + recipes + instructions
  → Test Project (isolated)
  → Run on test Brief (+ optional locks)
  → Review spawned nodes
  → Pin version → Install to library
```

**Requirements**
- Manifest-driven node recipes
- Permission scopes (read/write surfaces)
- Test runs isolated from real Continuity Log
- Project-level skill version pinning
- Skill nodes store `skillId`, `skillVersion`, `skillNodeKey`
- Supports all skill families (script, style, structure, packaging, domain)
- Public marketplace is later; internal/first-party packs first

---

### B.6 Feature: Convert Assets → Skills / Style Packs

| Item | Detail |
|------|--------|
| Type | Reference Ingest → human-reviewed distillation |
| Phase | After Style Lock + Skills Studio basics |
| Purpose | Turn reference videos/images into reusable Style Packs or Skills |

**Flow**
```
Upload references → Director analyzes
  → Draft Style Pack and/or Skill
  → Human review/edit
  → Save Style Lock preset and/or installable Skill
```

**Outputs**
- **Style Pack** → feeds Style Lock (rules + refs)
- **Skill** → optional full pipeline flavor (structure + style bias + packaging defaults)

**Guardrails**
- Never auto-publish
- Human approval required
- Source/license notes retained
- Does not overwrite Character Bible
- Converted skills obey permissions + pinning

---

### B.7 Combined extended flow

```
1. Upload draft idea → Brief → Confirm
2. (Optional) Upload style references → Style Pack / Skill
3. Lock Character Bible + Style Lock
4. Choose Skill(s): script and/or style/structure/domain
5. Script nodes → shots → generate media
6. Checkpoint approvals
7. Sequence assembly
8. Asset Library supplies packaging assets
9. HyperFrames packages deliverables
10. Export / festival / social variants
```

---

### B.8 Implementation order (extended features)

1. Upload draft → Brief  
2. Asset Library  
3. HyperFrames node  
4. Skills create & test (internal)  
5. Convert assets → style packs/skills  

---

### B.9 Core vs skill ownership (non-negotiable)

| Owned by system (core) | Can be skill-generated |
|------------------------|------------------------|
| Brief node + confirm gate | Draft brief content |
| Character Bible | Character suggestions (still human-locked) |
| Style Lock | Style Pack drafts |
| Continuity Log | Continuity patches via API only |
| Generate Shot / Router entry | Model preference hints |
| Checkpoint | — |
| Sequence shell | Ordered clip suggestions |
| HyperFrames node | Packaging templates / defaults |

---

*End of PRD v3.2*
