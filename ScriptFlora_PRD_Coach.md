# Feature PRD
## ScriptFlora Coach

**Version:** 1.0  
**Status:** Proposed  
**Parent:** ScriptFlora PRD v3.2  
**Inspiration:** HeyClicky-style screen-aware teaching (adapted for in-app React Flow)  
**Core principle:** Teach the Director method on the actual canvas while the user does the work.

---

## 1. Summary

**ScriptFlora Coach** is an in-app, state-aware tutor that:

- Reads current project/canvas state
- Grounds answers in product docs and Director-method rules
- Teaches through on-screen spotlight, step cards, and guided walkthroughs
- Can propose safe “do with me” actions (never silent credit spend)
- Respects plan gates, credits, and continuity locks

It is **not** a generic chatbot and **not** an unrestricted production agent.

---

## 2. Goals

### Goals
- Reduce time-to-first successful directed path
- Teach order: Brief → locks → skills → shots → checkpoint → sequence → package
- Unblock users at gates (unconfirmed Brief, missing locks, zero credits)
- Ground help in docs + live state
- Support Free → Creator conversion by explaining value at the right moment

### Non-goals (MVP)
- OS-wide screen overlay (Mac accessibility style)
- Fully autonomous multi-step agents that spend Runway/Director credits
- Voice-first system-wide control
- Replacing formal documentation

---

## 3. Persona & tone

| Attribute | Value |
|-----------|--------|
| Role | Production mentor / Director tutor |
| Tone | Calm, precise, film/theater-native |
| Avoid | Hype, “just prompt it”, unlimited-gen promises |
| Vocabulary | Brief, beat, scene, lock, checkpoint, continuity, shot, package |

Default sign-off energy: helpful, short, actionable.

---

## 4. UI surfaces

### 4.1 Coach entry
- Top-bar **Coach** button
- First-run auto-open (once)
- Contextual proactive chips on blockers (dismissible)
- Keyboard shortcut (e.g. `Cmd/Ctrl + J`)

### 4.2 Coach rail (desktop)
Collapsible right rail:

1. Chat thread  
2. Active checklist / lesson progress  
3. Actions: **Show me** · **Do with me** · **Skip** · **Docs**  
4. Plan/credit awareness strip (when relevant)

### 4.3 Mobile
Bottom sheet with same modes; spotlights still work on canvas.

### 4.4 On-canvas teaching layer
- Spotlight (dim + highlight target)
- Beacon pulse on control
- Arrow/connector from rail to target
- Floating step card near target
- Ghost node preview before creation

---

## 5. State schema (Coach context)

Coach must receive a structured snapshot before every reply.

```ts
type CoachState = {
  // session
  userId: string
  plan: "free" | "creator" | "studio"
  coachSettings: "full" | "important" | "off"
  firstRunCompleted: boolean

  // navigation
  route: "home" | "canvas" | "skills_studio" | "marketplace" | "settings" | "pricing"
  
  // project
  projectId?: string
  projectType?: "script" | "ad" | "episode" | "series" | "animation" | "training"

  // brief
  briefStatus: "empty" | "draft" | "generated" | "confirmed"
  briefHasUpload?: boolean

  // locks
  characterBiblePresent: boolean
  characterImagesLocked: boolean
  styleLockPresent: boolean

  // skills
  selectedSkillId?: string
  selectedSkillVersion?: string
  skillNodesCount: number

  // selection
  selectedNodeId?: string
  selectedNodeType?: string
  selectedNodeStatus?: "draft" | "generated" | "locked" | "stale" | "approved"

  // production progress
  shotPlanExists: boolean
  approvedShotCount: number
  sequenceClipCount: number
  hyperframesStatus?: "idle" | "building" | "rendering" | "ready" | "approved"

  // credits / gates
  directorCreditsRemaining?: number   // platform credits; null if using ChatGPT login only
  runwaySecondsRemaining?: number
  hyperframesRendersRemaining?: number
  hasChatGPTLogin: boolean
  usingPlatformDirector: boolean

  // blockers (derived)
  blockers: CoachBlocker[]
}

type CoachBlocker =
  | "brief_unconfirmed"
  | "skills_locked"
  | "character_images_missing_before_video"
  | "no_runway_credits"
  | "no_director_credits"
  | "sequence_empty"
  | "hyperframes_missing_sequence"
```

### Derived helper flags
- `canRunSkills = briefStatus === "confirmed"`
- `canGenerateVideo = plan !== "free" && runwaySecondsRemaining > 0 && characterImagesLocked` (when character shots)
- `canPackage = sequenceClipCount > 0`

---

## 6. Coach modes

| Mode | Behavior | Credit safety |
|------|----------|---------------|
| **Explain** | Answer + optional doc link | None |
| **Point / Show me** | Spotlight UI + 1 instruction | None |
| **Walkthrough** | Multi-step checklist with waits | None unless step requires action confirm |
| **Do with me** | Propose action → user confirms → execute safe mutation | Explicit confirm required for any credit spend |

---

## 7. Event model (MVP)

### 7.1 Client → Coach events

| Event | Payload (key fields) | Purpose |
|-------|----------------------|---------|
| `coach.opened` | route, state snapshot | Start session |
| `coach.message` | text, state snapshot | User question |
| `coach.show_me` | intentId, state | Request spotlight walkthrough |
| `coach.do_with_me` | actionId, state | Request guided action |
| `coach.step_completed` | walkthroughId, stepId | Advance checklist |
| `coach.step_skipped` | walkthroughId, stepId | Skip step |
| `coach.dismiss_proactive` | blockerId | Stop repeating tip |
| `coach.first_run_finished` | completed: boolean | Persist onboarding |

### 7.2 Coach → Client commands

| Command | Payload | Effect |
|---------|---------|--------|
| `ui.spotlight` | selector / nodeId, label | Highlight target |
| `ui.step_card` | text, anchor | Show floating step |
| `ui.clear_annotations` | — | Remove overlays |
| `ui.open_panel` | panelId | Open Brief/Skills/etc. |
| `nav.goto` | route | Navigate |
| `project.ensure_node` | nodeType, defaults | Propose create (needs confirm for Do with me) |
| `project.set_focus` | nodeId | Select node |
| `credits.explain_gate` | meter | Show upgrade/top-up CTA |
| `docs.open` | docPath | Open docs snippet |

All mutating commands in Do-with-me require `userConfirmed: true`.

---

## 8. First-run script (hands-on)

**Name:** `first_directed_path`  
**Duration target:** 3–5 minutes  
**Success:** user confirms a Brief and runs one built-in skill (or understands the gate if no AI access)

### Steps

| # | Step ID | Coach says (short) | On-screen action | User must do | Exit criteria |
|---|---------|--------------------|------------------|--------------|---------------|
| 1 | `welcome` | “I’ll coach you through a first directed script path.” | Open Coach rail | Continue | acknowledged |
| 2 | `create_project` | “Create a project. This is your production desk.” | Spotlight New Project | Create project | projectId exists |
| 3 | `brief_intro` | “Everything starts with a Brief. Skills stay locked until it’s confirmed.” | Spotlight Brief node | Open Brief | Brief panel open |
| 4 | `brief_fill` | “Upload notes or type an idea. You can generate structure next.” | Spotlight upload/textarea | Add some brief content | briefStatus draft/generated |
| 5 | `brief_confirm` | “Confirm locks the intent so later regenerations stay aligned.” | Spotlight Confirm | Confirm Brief | briefStatus confirmed |
| 6 | `skill_pick` | “Pick a skill. Auteur is best for dialogue-heavy continuity; Standard for clean structure.” | Spotlight Skill Selector | Select skill | selectedSkillId set |
| 7 | `skill_run` | “Run the skill to spawn structured nodes.” | Spotlight Run | Run skill (or explain ChatGPT/platform credit gate) | skillNodesCount > 0 OR gate shown |
| 8 | `inspect_nodes` | “These nodes are editable. Lock what works; regenerate only what doesn’t.” | Spotlight a script node + Lock control | Optional lock one node | step viewed |
| 9 | `next_path` | “Next production path: Character images → Style Lock → shots → generate → checkpoint → HyperFrames package.” | Show mini roadmap card | Finish | firstRunCompleted true |

### First-run rules
- If Free + no ChatGPT login at step 6–7: teach manual path + upgrade/connect options; do not fail the tour
- Never auto-spend platform credits during first-run
- User can exit anytime; progress saved

---

## 9. Top 20 coaching intents

Each intent includes detection cues, coach mode, and primary action.

| # | Intent ID | User says / situation | Mode | Coach does |
|---|-----------|------------------------|------|------------|
| 1 | `what_is_scriptflora` | “What is this?” | Explain | Category pitch: Director’s desk, not chat box |
| 2 | `first_run` | First login / “Help me start” | Walkthrough | Launch `first_directed_path` |
| 3 | `why_brief_confirm` | Skills disabled | Point | Spotlight Confirm; explain gate |
| 4 | `upload_brief_draft` | “I have notes/PDF” | Point + Do | Spotlight upload; optional extract flow |
| 5 | `choose_skill` | “Standard vs Auteur vs Series?” | Explain | One-line differences + recommend by project type |
| 6 | `lock_regen` | “How do I edit one part?” | Point | Spotlight Lock/Regen; teach surgical control |
| 7 | `character_before_video` | Tries video without character images | Point | Block path; teach Character Bible images first |
| 8 | `what_is_style_lock` | “Style Lock?” | Explain + Point | Definition + spotlight Style Lock node |
| 9 | `shot_plan_from_script` | “How do I get shots?” | Explain | Script-first → shot expander path |
| 10 | `why_checkpoints` | “Why can’t I generate all?” | Explain | Continuity + cost + quality rationale |
| 11 | `runway_credits_gate` | Generate blocked | Explain + CTA | Credits remaining; top-up / plan options |
| 12 | `director_credits_gate` | No ChatGPT + no platform credits | Explain + CTA | Connect ChatGPT or upgrade for platform Director credits |
| 13 | `sequence_before_hyperframes` | Opens HyperFrames early | Point | Need approved Sequence clips first |
| 14 | `hyperframes_purpose` | “What does HyperFrames do?” | Explain | Packaging/finishing, not scene generation |
| 15 | `assets_for_packaging` | “Where do logos go?” | Point | Asset Library → brand tags → HyperFrames bind |
| 16 | `skills_studio_test` | In Skills Studio | Walkthrough | Manifest → test project → pin version |
| 17 | `convert_refs_to_style` | Uploads reference images/video | Explain + Guide | Reference Ingest → review Style Pack → lock |
| 18 | `series_continuity` | Series project questions | Explain | Series skill + multi-episode memory path (as available) |
| 19 | `export_festival_package` | “Festival submission?” | Explain | Export package contents + disclosure reminder |
| 20 | `upgrade_why` | Hits Free limits | Explain | Honest value: continuity, video credits, packaging, team |

---

## 10. Response contract

Every Coach reply should prefer this shape:

1. **Answer in 1–2 sentences**  
2. **Next action** (one thing)  
3. **Optional on-screen move** (Show me / Do with me)  
4. **Optional doc link**

Example:

> Skills stay locked until the Brief is confirmed — that keeps later regenerations aligned to the same intent.  
> **Next:** Confirm the Brief.  
> [Show me] [Docs: Brief gate]

---

## 11. Proactive coaching policy

| Allowed proactive | Not allowed |
|-------------------|-------------|
| First-run offer | Repeating nags after dismiss |
| Hard blockers (unconfirmed Brief, zero credits) | Interrupting active typing constantly |
| First open of Skills Studio / HyperFrames | Selling on every message |
| Milestone congratulations (once) | Auto-running paid generations |

Respect `coachSettings`.

---

## 12. Safety rules

1. No bypass of Confirm Brief / Checkpoint  
2. No credit spend without explicit confirm  
3. No false claims of Free video generation  
4. No publishing skills without Studio test/review path  
5. No legal/festival guarantees  
6. If state insufficient, ask a precise clarifying question  
7. Prefer teaching order over “hacky” shortcuts that break continuity  

---

## 13. MVP acceptance criteria

- [ ] Coach rail opens and receives state snapshot  
- [ ] Docs-grounded answers for top 20 intents  
- [ ] Spotlight + step card on Brief Confirm and Skill Selector  
- [ ] First-run walkthrough completable in one session  
- [ ] Blocker tips for unconfirmed Brief and zero Runway credits  
- [ ] Do-with-me requires confirm and cannot silent-charge credits  
- [ ] Plan-aware messaging (Free vs Creator)  
- [ ] User can set Coach to Important only / Off  

---

## 14. Metrics

| Metric | Intent |
|--------|--------|
| First-run completion rate | Onboarding quality |
| Time-to-confirmed Brief | Activation |
| Time-to-first skill run | Activation |
| Blocker resolution rate after Coach tip | Usefulness |
| Coach-assisted upgrade conversion | Monetization alignment |
| Dismiss rate of proactive tips | Annoyance control |

---

## 15. Implementation phases

### MVP
- State snapshot
- Chat + Explain/Point
- First-run script
- Top 20 intents
- Spotlight/step cards for key controls
- Credit/plan gates messaging

### v1.1
- Do with me for safe node creation/focus
- Skills Studio mini-walkthrough
- HyperFrames packaging walkthrough

### Later
- Voice input
- Richer annotation drawing
- Team/classroom coach scripts
- Skill-authored coach tips (verified skills only)

---

## 16. Positioning

> ScriptFlora Coach teaches directed production on the canvas itself —  
> not another chat window to ignore.

**Create with AI. Review with humans. Learn in the flow.**

---

*End of Coach Feature PRD v1.0*
