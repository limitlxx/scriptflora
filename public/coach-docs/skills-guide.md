# Skills Guide — ScriptFlora

## What is a skill?
A skill is a generation pipeline — a set of prompt stages that transforms a confirmed Brief into structured script nodes. Built-in skills are provided by ScriptFlora. Custom skills can be authored in Skills Studio and shared via the marketplace.

## Built-in skills

### Standard Script
- Best for: ads, training, social, short-form
- Stages: Hook → Scene → Dialogue → Visual Directions → Call to Action
- Requires: confirmed Brief
- Permissions: read:brief, write:skill_nodes

### Auteur Script (Storyline Auteur)
- Best for: films, continuity-heavy generation, long-form, dialogue-heavy projects
- Stages: Stageplay → Screenplay → Technical Screenplay → Production Summary → Auteur Script
- Requires: confirmed Brief + locked Character Bible (at least one character with reference image)
- Permissions: read:brief, read:bible, read:style, write:skill_nodes

### Series Script Structure
- Best for: episodic drama, season planning, multi-episode continuity
- Stages: Series Hook → Episode Outline → Act Beat → Series Visual Notes → Episode Close
- Requires: confirmed Brief + locked Character Bible + Episode Memory node present
- Permissions: read:brief, read:bible, read:style, write:skill_nodes, write:continuity_patch

## Choosing a skill
- Short commercial or social post → **Standard Script**
- Narrative film, drama, or anything with strong character continuity → **Auteur Script**
- Multi-episode series → **Series Script**
- Standard is best for testing; Auteur requires a locked Character Bible first

## Skills Studio
- `/skills` — list and manage skills
- `/skills/[id]` — 5-tab editor: Manifest, Instructions, Recipe, Test run, Version
- Test run creates isolated sandbox nodes; they never touch the real Continuity Log
- Publish requires a Studio plan and a passing test run

## Skill safety rules
- Skills cannot replace core system nodes
- Continuity mutations must go through the Continuity API
- Skills declare all permissions upfront; canvas validates before generation runs
- Marketplace skills show trust tier (Official / Community) and full permission list before install
