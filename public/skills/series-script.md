# Skill: Series Script Structure

## Description
Season arcs, episode maps, and multi-episode continuity planning for episodic drama, long-form series, and educational course content.
Designed to maintain character consistency and story continuity across episodes.
Use the Episode Memory node to persist character exit/entry states between episodes.

## Pipeline Stages (in order)
1. **Series Hook** – The series-wide hook: what is the show about, who is it for, why will they keep watching
2. **Episode Outline** – A detailed outline for this episode: acts, beats, character arcs, what the episode resolves
3. **Act Beat** – The main dialogue/narration beats for this episode (one per act section, repeatable)
4. **Series Visual Notes** – Visual identity rules, recurring location notes, costume/wardrobe continuity reminders
5. **Episode Close** – How this episode ends: what changes, what threads are left open for next episode

## Generation Rules
- Always respect the Brief (topic, objective, audience, platform, duration, tone, key facts)
- Key facts must never be contradicted or omitted
- Treat each episode as a unit within a larger arc — reference what came before if known
- Character descriptions must stay consistent with the Character Bible when provided
- Visual notes must stay consistent with the Style Lock when provided
- The Episode Outline must include: episode title, episode number, what is resolved, what is left open
- Act Beats should feel like real dialogue — natural speech rhythm, clear speaker tags
- Episode Close should set up the next episode with at least one open thread
- Duration influences number of Act Beat nodes:
  - 5–10 min → 2 beats
  - 20–30 min → 3–4 beats
  - 45 min+ → 5–6 beats

## Node Mapping (generated in order)
- hook (×1)
- scene (×1) — use for Episode Outline
- dialogue (×N, repeatable) — use for Act Beats
- visual (×1) — use for Series Visual Notes
- cta (×1) — use for Episode Close