# Feature Document
## HyperFrames Node — ScriptFlora

**Product:** ScriptFlora  
**Feature:** HyperFrames Composition Node  
**Version:** 1.0  
**Status:** Proposed  
**Related phases:** Phase 4 (Assembly & Export), Phase 7 (Packs / Social)  
**Depends on:** Approved Sequence / clips, optional Character Bible, Style Lock, script text

---

## 1. Summary

The **HyperFrames Node** lets ScriptFlora turn approved media + script context into a finished, designed video package using [HeyGen HyperFrames](https://hyperframes.heygen.com/developers) — an HTML → video framework.

It does **not** replace generative shot models (Runway, Kling, Veo, etc.).  
It **composites and finishes**:

- generated clips
- dialogue/voice tracks
- captions / titles / lower thirds
- branding / end cards
- platform-safe layouts

**One-line:**  
*Director plans → models generate shots → HyperFrames packages the cut.*

---

## 2. Problem

After ScriptFlora generates and approves shots, users still need:

- Titles, captions, lower thirds
- Brand frames and end cards
- Safe-area layouts for 9:16 / 1:1 / 16:9
- Consistent packaging across many outputs
- A deterministic way to combine clips + audio + graphics

Manual editors solve this, but break the Director-controlled, repeatable pipeline.  
HyperFrames provides a code-native, agent-friendly composition layer that fits ScriptFlora’s architecture.

---

## 3. Goals

### Goals
- Add a first-class **HyperFrames** node on the canvas
- Compose approved Sequence clips + audio + text into a renderable HTML composition
- Support template-based packaging (ad, explainer, social, training)
- Render locally (CLI path) or via HeyGen Cloud Rendering API
- Keep human review before final export
- Preserve provenance (which clips, template, variables, render id)

### Non-goals (v1)
- Replacing generative video models
- Full After Effects–style motion design suite inside ScriptFlora
- Building a complete HyperFrames visual editor from scratch
- Automatic long-form film finishing without checkpoints

---

## 4. User value

| User | Value |
|------|--------|
| Educators / training teams | Script → voice/clips → branded explainer package |
| Ad / marketing teams | Shot sequence → platform cuts with captions & end cards |
| Series / short-film teams | Rough cut packaging with titles and continuity-safe overlays |
| Agencies | Repeatable templates across clients/projects |

---

## 5. Placement in the app flow

```
Brief → Skills → Script nodes
    → Character / Style locks
    → Shots → Generate (Runway/etc.)
    → Checkpoint approve
    → Sequence (ordered clips + audio)
    → HyperFrames Node          ← this feature
    → Preview / Checkpoint
    → Export package / publish variants
```

**Rule:** HyperFrames runs only on **approved** upstream sequence content (or explicitly allowed drafts for template testing).

---

## 6. Feature description

### 6.1 Node type

**Name:** HyperFrames  
**Origin:** `core` (system node; not marketplace-owned in v1)  
**Category:** Assembly / Packaging

### 6.2 What the node does

1. Reads upstream Sequence (clips, audio alignment, script lines, durations)
2. Selects a **composition template** (built-in or skill-provided later)
3. Maps ScriptFlora data → HyperFrames variables + timeline clips
4. Builds / updates an HTML composition bundle
5. Renders to video (draft or final)
6. Stores result + provenance on the node
7. Allows human approve / reject / regenerate package

### 6.3 Inputs

| Input | Required | Source |
|-------|----------|--------|
| Sequence / ordered clips | Yes | Sequence node |
| Dialogue audio tracks | Optional | Voice path / Sequence |
| Script text / captions | Optional | Script nodes |
| Brand kit / Style Lock | Optional | Style Lock / project settings |
| Template id | Yes | User select or skill default |
| Aspect ratio targets | Yes | User (16:9, 9:16, 1:1, etc.) |
| Variables | Optional | Title, CTA, logo URL, colors, etc. |

### 6.4 Outputs

| Output | Description |
|--------|-------------|
| Composition bundle | HTML/CSS/assets project (zip or project ref) |
| Rendered video(s) | MP4/WebM/MOV per aspect ratio |
| Preview URL / thumbnail | For checkpoint UI |
| Provenance record | Template, variables, source clip ids, render ids |
| Export package extras | Captions file, chapter markers if available |

---

## 7. Node UI (canvas)

### Collapsed view
- Icon + title: `HyperFrames`
- Status chip: `Draft` | `Building` | `Rendering` | `Ready` | `Failed`
- Template name
- Aspect ratios selected
- Mini preview thumbnail when ready

### Expanded panel
1. **Template picker**  
   - Explainer  
   - Ad / commercial  
   - Social vertical  
   - Training module  
   - Custom (advanced)
2. **Variable editor**  
   - Title, subtitle, CTA, logo, colors, lower-third text
3. **Clip mapping**  
   - Auto-map from Sequence order  
   - Optional manual override per track slot
4. **Render settings**  
   - Quality: draft / standard / high  
   - FPS, format, resolution  
   - Target ratios
5. **Actions**
   - Build composition  
   - Render draft  
   - Render final  
   - Open preview  
   - Approve package  
   - Export

### States
- `idle`
- `mapping`
- `building_composition`
- `rendering`
- `ready_for_review`
- `approved`
- `failed` (with retry)

---

## 8. Templates (v1)

Ship a small first-party set:

| Template | Purpose | Typical inputs |
|----------|---------|----------------|
| `explainer_16x9` | Educational / product explainers | clips + narration + titles |
| `ad_endcard_16x9` | Short ad with end card/CTA | clips + logo + CTA text |
| `social_9x16` | Vertical social package | clips + captions + safe margins |
| `training_module` | Lesson segment packaging | clips + section titles + key facts |

Each template is a HyperFrames HTML composition with documented variables.

---

## 9. Data mapping rules

### From Sequence → composition
- Clip order preserved unless user remaps
- Clip in/out points honored when available
- Missing clips block final render (warn in draft)
- Audio tracks aligned by Sequence timestamps when present

### From script → captions/titles
- Preferred: locked script lines with timings
- Fallback: plain caption list
- Key facts can appear as callout overlays if template supports them

### From Style Lock / brand kit
- Colors, logo, font preferences injected as variables
- Templates must degrade gracefully if brand kit absent

---

## 10. Rendering paths

### Path A — HeyGen Cloud Rendering (default for v1 hosted)
1. Build composition bundle
2. Upload zip / asset
3. `POST /v3/hyperframes/renders` with variables
4. Poll or webhook until complete
5. Attach output URL to node

### Path B — Local / self-hosted (optional later)
- Use HyperFrames CLI in worker: `hyperframes check` → `hyperframes render`
- Useful for offline or cost control

**v1 recommendation:** Cloud path first; local as Phase 2 enhancement.

---

## 11. Checkpoint & human control

Before package is marked export-ready:

1. User previews rendered output
2. Can request:
   - re-render with same mapping
   - change template/variables
   - fix upstream Sequence then rebuild
3. Approve locks the package version
4. Approved packages are included in project export

Matches ScriptFlora principle: **Create with AI. Review with humans.**

---

## 12. Provenance (required)

Store on node result:

```ts
{
  provider: "hyperframes",
  renderMode: "heygen_cloud" | "local",
  templateId: string,
  templateVersion: string,
  variables: Record<string, string>,
  sourceSequenceId: string,
  sourceClipIds: string[],
  aspectRatios: string[],
  renderIds: string[],
  outputAssets: Array<{ ratio: string; url: string; format: string }>,
  createdAt: string,
  skillId?: string,      // if template came from a skill later
  skillVersion?: string
}
```

---

## 13. Permissions & safety

- Only read approved Sequence media by default
- No silent overwrite of upstream generative clips
- Template execution cannot mutate Character Bible / Continuity Log
- Cloud renders use project-scoped credentials
- Failed renders must not delete prior approved outputs

---

## 14. Technical outline

### Frontend
- New node type in React Flow canvas
- Template + variable form (shadcn)
- Status polling UI
- Preview player

### Backend / worker
- Composition builder service (Sequence + template → HTML bundle)
- HyperFrames render client (HeyGen API)
- Asset storage for outputs
- Webhook/poll handler

### Template storage
- First-party templates in repo or CDN
- Manifest per template:
  - id, version, ratios supported
  - required variables
  - optional variables
  - expected track slots

---

## 15. Acceptance criteria (v1)

- [ ] User can add HyperFrames node downstream of Sequence
- [ ] User can pick a first-party template and edit variables
- [ ] Node auto-maps approved Sequence clips in order
- [ ] Draft render produces previewable video
- [ ] Final render stores outputs + provenance
- [ ] User can approve/reject package
- [ ] Export includes HyperFrames outputs when approved
- [ ] Failure states are visible and retryable
- [ ] Does not run if required upstream clips are missing (final mode)

---

## 16. Metrics

| Metric | Intent |
|--------|--------|
| HyperFrames node attach rate | Adoption after Sequence |
| Draft → final render conversion | Usefulness |
| Template usage distribution | Which packages matter |
| Re-render rate | Template/mapping quality |
| Export inclusion rate | Real finishing value |

---

## 17. Rollout plan

### Milestone A — Internal template path
- 1–2 templates
- Manual variable entry
- Cloud render only
- Single aspect ratio

### Milestone B — Sequence auto-map + multi-ratio
- Auto clip mapping
- 16:9 + 9:16
- Checkpoint UX polished

### Milestone C — Brand kit + more templates
- Style Lock injection
- Ad / training / social set
- Export package integration

### Later
- Skill-provided HyperFrames templates (marketplace-ready)
- Local render worker
- Deeper caption timing from script nodes

---

## 18. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Users confuse this with generative video | Copy: “Package & finish,” not “Generate scene” |
| Template quality too low | Start with few strong templates |
| Render cost surprises | Show estimate before final render |
| Mapping errors | Draft mode + clear clip checklist |
| Over-scope into full editor | No custom timeline editor in v1 |

---

## 19. Positioning in ScriptFlora

**Generative models** create the shots.  
**HyperFrames node** packages the approved cut into a designed deliverable.

This keeps ScriptFlora as the Director system:

> Script → Continuity → Shots → Generate → Checkpoint → **Compose (HyperFrames)** → Export

---

## 20. Open questions

1. Default render provider credentials: platform-managed vs user-provided HeyGen key?
2. Should social variants be one node with multi-ratio outputs or one node per ratio?
3. Do we allow HyperFrames-only projects (no generative shots), e.g. avatar + graphics explainers?


mkae sure the hyperframe implementation for phase 11 and the local cli is correct based on the documentation
https://hyperframes.heygen.com/developers/overview
https://hyperframes.heygen.com/guides/authentication
https://hyperframes.heygen.com/sdk/quickstart
https://hyperframes.heygen.com/developers/cli

---

*End of feature doc*
