# ScriptFlora Node Reference

## Setup nodes
- **Brief** — Project intake. Fill title, objective, audience, platforms, duration, tone, key facts. Must be *Confirmed* before skills can run. This is a hard gate — not optional.
- **Skill Selector** — Choose the generation pipeline: Standard Script, Auteur Script, or Series Script.

## Continuity core
- **Character Bible** — Character identity, reference images, voice profiles. Lock a character (with a reference image) before video generation for that character.
- **World / Style Lock** — Visual rules, medium (live-action / animation / hybrid), hard constraints. Lock style rules before generation to inject them into every prompt.
- **Continuity Log** — Per-scene character states, revealed facts, open threads. Feeds into continuity checks.

## Standard Script skill nodes
- **Hook** — First 3 seconds
- **Scene** — Action and setting
- **Dialogue** — Character voice
- **Visual Directions** — Camera, light, motion
- **Call to Action** — The close

## Auteur Script skill nodes (5-stage funnel)
Stage I: Stageplay → Stage II: Screenplay → Stage III: Technical Screenplay → Stage IV: Production Summary → Stage V: Auteur Script

## Shot layer
- **Shot List** — Expands a scene into individual shots with camera, action, dialogue, continuity notes, opening/ending state.
- **Storyboard Frame** — Key-frame image per shot. Approve to use as video reference.
- **Sequence** — Ordered shot skeleton across all scenes, no media yet.

## Media generation
- **Generate Shot** — Routes to Runway models (Gen-4 Turbo / Gen-4.5 / Act-Two / Aleph 2.0 / Veo 3.1) based on shot type.
- **Result** — Holds generated clip + audio + full provenance. Approve or reject.
- **Checkpoint** — Human gate before next batch runs. Must have minimum approved results.

## Assembly & export
- **Timeline** — Rough-cut preview. Sync approved results, reorder clips, toggle transitions.
- **HyperFrames** — Packages approved clips into a designed deliverable using HTML composition templates. Requires a Sequence with clips.
- **Export Package** — Full handoff package for NLE (DaVinci, Premiere, CapCut, Descript).

## Automation
- **Batch Planner** — Director proposes next N shots; user approves the plan before generation runs.
- **Autopilot Dashboard** — Drives batch generation loop, surfaces progress, cost, and open continuity issues.

## Memory (series/long-form)
- **Episode Memory** — Exit/entry state handoff between episodes. One per episode boundary.
- **Series Arc** — Season arc beats, character milestones, open/resolved threads.

## Packs, social, team
- **Project Pack** — Medium-specific defaults (Ads, Series, Animation, Education, Hybrid).
- **Social Variants** — Platform cuts with aspect ratios, captions, publish schedule.
- **Team Workspace** — Comments, approvals, brand kit notes.

## Review nodes
- **Continuity Checker** — Cross-scene consistency check via AI.
- **Multi-Format Output** — Download screenplay / shotlist / social cuts.
- **Export** — Markdown / PDF / Final Draft export.
