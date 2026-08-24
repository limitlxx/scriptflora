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
- Output: Clean dialogue exchange, character names in CAPS, no stage directions

### Stage 2 — Screenplay
- Convert Stageplay into standard screenplay format
- Add sensory texture (ambient sound, light quality, silence, atmosphere)
- Still avoid detailed blocking or camera directions
- Output: INT./EXT. scene header + atmosphere + dialogue with minimal action lines

### Stage 3 — Technical Screenplay
- Direct the physical stageplay as if on a theater stage
- Assign Stage Left / Stage Right / Center Stage positions
- Detail every micro-movement
- Establish spatial anchors (desk, chair, props, etc.)
- Zero cinematography yet
- Output: Full blocking with spatial coordinates and prop states

### Stage 4 — Production Summary
- Single-source visual rule sheet for the entire piece
- Lock character wardrobe, age, body language, glasses, props
- Lock environment (walls, lighting, furniture materials)
- This summary is referenced in every later generation call
- Output: Structured reference sheet (Characters, Environment, Props, Rules)

### Stage 5 — Auteur Script
- Split long scenes into 20–30 second generation chunks
- Use the scaffold below for each chunk:

[INTENT]
High-level theme / emotional heart of this chunk

[LOGIC]
Hard guardrails: spatial continuity, physics, camera persistence, character position inheritance from Production Summary

[AESTHETIC]
Environment + wardrobe + lighting + color palette + key props (from Production Summary)

[OPENING]
Exact first-frame anchor: camera position + character positions + posture + prop states = Macro-State S0

[EXECUTION]
Sequence of Macro-States:
[CAM nn] shot description -> [ACT] micro-action -> Character: {dialogue} -> <SFX>

## Generation Rules
- Always respect the full Brief (topic, objective, audience, platform, duration, tone, key facts)
- Key facts must never be contradicted or omitted
- Maintain strict spatial and character continuity across all five stages
- Each stage builds directly on the previous — never skip a stage
- Prefer clarity and precision over literary flourish
- Output each stage clearly labeled and independently editable

## Node Mapping (generated in order, one of each)
- auteur-stageplay (×1)
- auteur-screenplay (×1)
- auteur-technical (×1)
- auteur-production-summary (×1)
- auteur-script (×1)
