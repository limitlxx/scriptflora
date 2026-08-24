### 1. Skills as Markdown Files (for context / loading in the app)

Save these as two separate files in your project (e.g. `/skills/standard-script.md` and `/skills/storyline-auteur-script.md`).

---

**File: `skills/standard-script.md`**

```markdown
# Skill: Standard Script

## Description
A clean, professional script structure suitable for educational videos, advertisements, training content, and general video/audio production.

## Pipeline Stages (in order)
1. **Hook** – Strong opening that grabs attention within the first 3–5 seconds
2. **Scenes / Beats** – 3–5 main content blocks that deliver the core message
3. **Dialogue / Narration** – Spoken content (can be voice-over or on-screen talent)
4. **Visual Directions** – Camera, text overlays, b-roll, or motion suggestions
5. **Call to Action (CTA)** – Clear next step for the viewer

## Generation Rules
- Always respect the Brief (topic, objective, audience, platform, duration, tone, key facts)
- Key facts must never be contradicted or omitted
- Keep language natural and matched to the selected tone
- Duration should influence pacing and number of scenes
- Output each stage as clean, editable text
- Prefer short paragraphs and clear spoken rhythm

## Node Mapping
- Hook Node
- Scene Node (repeatable, default 3)
- Dialogue/Narration Node
- Visual Directions Node
- CTA Node
```

---

**File: `skills/storyline-auteur-script.md`**

```markdown
# Skill: Storyline Auteur Script

## Description
Advanced pipeline based on the Frequency Over Force method. Designed for dialogue-heavy, spatially continuous scenes intended for generative AI video models (e.g. Seedance and similar). Treats the AI video model as a state machine that inherits spatial, wardrobe, and prop continuity.

## Core Principle
Hold clear human intent + rigid structure so the model produces coherent, continuous scenes instead of noise.

## 5-Stage Writing Funnel (execute in strict order)

### Stage 1 — Stageplay (Dialogue Only)
- Pure spoken words and natural conversation rhythm
- Minimal or zero physical actions
- Goal: Is the dialogue natural and clear?

### Stage 2 — Screenplay
- Convert Stageplay into standard screenplay format
- Add sensory texture (ambient sound, light quality, silence, atmosphere)
- Still avoid detailed blocking or camera directions

### Stage 3 — Technical Screenplay
- Direct the physical stageplay as if on a theater stage
- Assign Stage Left / Stage Right / Center Stage positions
- Detail every micro-movement
- Establish spatial anchors (desk, chair, props, etc.)
- Zero cinematography yet

### Stage 4 — Production Summary
- Single-source visual rule sheet
- Lock character wardrobe, age, body language, glasses, etc.
- Lock key props and their exact placement
- Lock environment (walls, lighting, furniture materials)
- This summary is referenced in every later generation

### Stage 5 — Auteur Script
Split long scenes into 20–30 second generation chunks using this scaffold:

[INTENT]
High-level theme / emotional heart

[LOGIC]
Hard guardrails: spatial continuity, physics, camera persistence, character position inheritance

[AESTHETIC]
Environment + wardrobe + lighting + color palette + key props (from Production Summary)

[OPENING]
Exact first-frame anchor (camera + character positions + posture + prop states) = Macro-State S0

[EXECUTION]
Sequence of Macro-States:
[CAM nn] shot description -> [ACT] micro-action -> Character: {dialogue} -> <SFX>

## Generation Rules
- Always respect the full Brief and key facts
- Maintain strict spatial and character continuity across stages
- Prefer clarity and precision over literary flourish
- Output each stage clearly labeled and editable

## Node Mapping
- Stageplay Node
- Screenplay Node
- Technical Screenplay Node
- Production Summary Node
- Auteur Script Node (with macro-state support)
- Continuity Checker Node (recommended)
```

=== INTERACTIONS TO SUPPORT ===

- Selecting a skill dynamically creates the correct set of connected nodes
- Clicking Regenerate on any content node should feel instant (show loading spinner on that node only)
- Locked nodes have a distinct visual style (e.g. lock icon + muted border)
- Smooth edges between nodes
- Mini-map in bottom right
- Controls (zoom, fit view) in bottom left
 
---

 