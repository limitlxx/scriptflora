Generate clips → join them under Director control → human checkpoints.  
You still need *some* editing, but far less than a traditional pipeline.

---

### 1. Joining clips vs full video editing

| Approach | What it means | Reality |
|----------|----------------|---------|
| **In-app assembly** | ScriptFlora orders clips, applies simple cuts/transitions, exports a timeline | Good for first cuts, reviews, and many short/mid-form pieces |
| **Export to editor** | Ordered clips + script markers + continuity notes go to CapCut / Premiere / DaVinci / Descript | Still needed for polished 1-hour work (sound design, music, fine pacing, color, titles) |

**Recommendation:**  
Do **both**.

- Build a lightweight **Sequence / Timeline node** inside ScriptFlora for ordering, basic joins, and review.
- Always allow **Export package** (numbered clips + script + shot list + continuity log) for serious finishing.

For a 1-hour film you will almost always do a final pass in a real editor. ScriptFlora’s job is to get you 80–90% of the way with structure and continuity intact.

---

### 2. Can it work with voice?

**Yes.** Voice is essential for film, ads, series, and cartoons. Treat it as a parallel track controlled by the same Director.

#### Practical voice path

```
Script (dialogue) 
    ↓
Director assigns voice per character (voice ID / style)
    ↓
TTS or voice model generates line-by-line (or beat-by-beat) audio
    ↓
Optional lip-sync / mouth motion applied to the video clip
    ↓
Audio + video joined in the Sequence node
```

**Options that work today:**
- **Dialogue audio first** (often better): generate clean voice tracks from the script, then generate or adjust video to match.
- **Video first, then voice**: possible but harder to keep lip-sync and pacing tight.
- **Character voice lock**: same voice ID / sample for a character across the whole film or series (multi-episode memory helps here).

Lip-sync is improving but still imperfect on long takes. Best practice:
- Prefer shorter shots
- Generate audio per beat / macro-state
- Use lip-sync tools only where the mouth is clearly visible
- Accept some manual fix in the final editor for a 1-hour piece

So: **voice is fully in scope**. It should be a first-class citizen next to picture, not an afterthought.

---

### 3. How the three features you liked fit

#### Autopilot batches + scheduled human checkpoints
```
Director plans next 5–15 shots
    ↓
System generates video + voice for that batch
    ↓
Checkpoint: human reviews the batch (approve / reject / regenerate specific shots)
    ↓
Only then does the next batch run
```
This is the only sane way to aim at long-form. Full autopilot without checkpoints will drift.

#### Dialogue audio / lip-sync path
- Character Bible stores voice profile + visual reference
- Each dialogue line in the Auteur / script node carries speaker + emotion + timing notes
- Router can call TTS + lip-sync models when the shot needs it
- Sequence node aligns audio and picture

#### Multi-episode memory (series → feature length)
- Character states, revealed facts, open threads, wardrobe, and voice IDs persist
- Episode N exit state becomes Episode N+1 entry state
- A “feature” can be assembled from multiple episodes or treated as one long season arc
- This is how you reach ~1 hour without pretending one model generated it in a single pass

---

### 4. Recommended production flow for longer work

1. **Brief + Series/Film architecture** (Director)
2. **Character Bible + Voice profiles + Style Lock**
3. **Episode / Act outlines → full scripts** (Auteur or Standard)
4. **Shot / macro-state breakdown**
5. **Batch generation** (video + dialogue audio)
6. **Human checkpoint** after each scene or batch
7. **In-app sequence** for rough cut
8. **Export package** → final edit + sound design + grade in a proper NLE
9. **Multi-format outputs** (theatrical cut, vertical, trailer, social)

---

### Bottom line

| Question | Answer |
|----------|--------|
| Generate clips and join them? | Yes — core design |
| Still need video editing? | Yes for polished 1-hour; lightweight assembly inside ScriptFlora for review and shorter work |
| Voice support? | Yes — dialogue audio + optional lip-sync as a formal path |
| Autopilot with checkpoints? | Yes — best way to scale length |
| Multi-episode → feature length? | Yes — via continuity memory and assembly |

ScriptFlora becomes the **Director + continuity + routing layer**.  
Video models and voice models are the crew.  
Humans approve the performances that matter.  
A real editor still finishes the 1-hour cut.

---

**ScriptFlora Development Phase Process**  
*From script tool → Director’s desk for AI film (ads, series, movies, animation)*

Use this as the working roadmap to update the product. Each phase has a clear goal, scope, exit criteria, and dependencies.

---

## Guiding principles (do not break)

1. **ChatGPT = Director / Brain** — plans, structures, enforces continuity, decides next actions  
2. **Video & voice models = crew** — execute only under strict briefs + references  
3. **Human checkpoints remain mandatory** for anything longer than short clips  
4. **Generate in small units (macro-states / shots), then assemble**  
5. **Never lose the existing strengths**: Brief, Skills, Nodes, Lock/Regen, Key Facts, own ChatGPT login  

---

## Phase 0 — Stabilize current foundation  
**Goal:** Make the existing script system production-reliable before adding media generation.

### Scope
- Harden Brief Intake + Brief Generator
- Finalize skill system (Standard, Auteur, Series Script Structure)
- Improve individual node regeneration + lock behavior
- Continuity / fact checker (text-level)
- Clean export (Markdown + structured JSON)
- Mobile-friendly critical flows
- Feedback loop from testers

### Exit criteria
- Users can go from idea → confirmed brief → structured script → export reliably
- Section regen respects brief + locks
- Series skill produces usable episode outlines with continuity notes


---

## Phase 1 — Continuity Core (Character + World + Voice)  
**Goal:** Give the Director persistent memory so later stages don’t drift.

### New capabilities
- **Character Bible node**
  - Name, role, goals, traits
  - Visual description + reference images
  - Wardrobe / body language signatures
  - **Voice profile** (voice ID, tone, sample notes)
- **World / Style Lock node**
  - Medium: live-action / animation / hybrid
  - Visual rules, color palette, era, locations
  - Hard constraints (what must never change)
- **Continuity Log**
  - Character entry/exit states per scene or episode
  - Revealed facts, open threads, wardrobe changes
- Force every script / Auteur generation to read Bible + Style Lock

### Exit criteria
- A character’s description and voice profile survive across multiple generations
- Style Lock is injected into every relevant prompt
- Continuity Log can be updated after each scene/episode

### Depends on
Phase 0

---

## Phase 2 — Shot-level Director layer  
**Goal:** Break scripts into generation-ready units the crew can execute.

### New capabilities
- **Shot / Macro-State expander**
  - Turns Auteur Script (or scene) into ordered shots/beats
  - Each shot has: duration target, camera, action, dialogue, continuity notes, opening state, ending state
- **Generation Brief exporter**
  - Structured package per shot: prompt + references + constraints + voice lines
- **Sequence skeleton**
  - Ordered list of shots/scenes (no media yet)
  - Status: pending / generated / approved / rejected

### Exit criteria
- From one scene script you can produce a clean shot list + generation briefs
- Director can propose the next shot batch
- Human can approve/reject at shot or scene level

### Depends on
Phase 1

---

## Phase 3 — Media generation routing (Video + Voice)  
**Goal:** Connect the first real “crew” models under Director control.

### New capabilities
- **Model Router**
  - Rules by shot type, medium, length, character needs
  - Pluggable providers (start with 1–2 video models + 1 TTS path)
- **Generate Shot node**
  - Calls video model with Director brief + Character/Style references
  - Optional parallel **dialogue audio** generation from script lines + voice profile
- **Basic lip-sync path** (optional, where mouth is visible)
- **Result node**
  - Stores clip + audio + generation parameters + continuity snapshot
- **Checkpoint gate**
  - Human must approve a batch/scene before the next batch runs

### Exit criteria
- Can generate a short sequence of clips (e.g. 5–15 shots) with matching dialogue audio
- Rejected shots can be regenerated with the same continuity context
- All generations are traceable (what brief, what references, what model)

### Depends on
Phase 2

---

## Phase 4 — Assembly & rough-cut  
**Goal:** Join approved clips into a watchable sequence inside ScriptFlora.

### New capabilities
- **Sequence / Timeline node**
  - Order clips, simple cut points, basic transitions
  - Align dialogue audio to picture
- **Rough-cut preview**
- **Export package**
  - Numbered clips
  - Aligned audio
  - Script + shot list + continuity log
  - Markers for a real NLE (Premiere, CapCut, DaVinci, Descript)
- Still expect final polish (sound design, grade, music, fine pacing) in an external editor for serious long-form

### Exit criteria
- User can produce a rough cut of a short film / episode segment inside the app
- Export package is usable in a professional editor without re-organizing everything manually

### Depends on
Phase 3

---

## Phase 5 — Autopilot with scheduled human checkpoints  
**Goal:** Scale length without losing control.

### New capabilities
- **Batch planner** (Director proposes next N shots/scenes)
- **Autopilot run** with configurable checkpoint frequency  
  (e.g. every scene, every 5 shots, every X minutes of content)
- Pause → human review → continue / regenerate / change direction
- Progress dashboard (scenes done, open continuity issues, cost so far)

### Exit criteria
- Can run a multi-scene batch overnight or over hours with clear human gates
- Continuity errors are surfaced at checkpoints instead of silently compounding

### Depends on
Phase 4

---

## Phase 6 — Multi-episode / feature-length memory  
**Goal:** Support series that accumulate into long-form (including ~1 hour+ when assembled).

### New capabilities
- Persistent **series memory** across episodes
- Episode exit state → next episode entry state
- Season / film arc tracking (open threads, payoffs, character change)
- “Assemble feature” view: select episodes/acts → one continuity-aware sequence
- Cross-episode Character + Voice + Style consistency checks

### Exit criteria
- Multiple episodes can be developed with stable characters and plot memory
- A longer piece can be assembled from episodic units under Director supervision

### Depends on
Phase 5 (or late Phase 4 for lighter version)

---

## Phase 7 — Medium-specific packs & distribution  
**Goal:** Make the system feel native for different film types.

### Packs
- Ads / commercials
- Series / episodic drama
- Animation / cartoon
- Educational / training film
- Hybrid

### Additions
- Pack-specific default skills, router settings, and checkpoint styles
- Social / platform variants (vertical cuts, trailers, hooks, captions)
- Thumbnail / key art generation from the same Style Lock + brief

### Depends on
Phases 3–6

---

## Cross-cutting work (runs through all phases)

| Area | What to maintain |
|------|------------------|
| Auth | Login with ChatGPT as the Director brain |
| Human control | Lock, approve, reject, regenerate at every important gate |
| Cost visibility | Show estimated generation cost before batches |
| Observability | Log briefs, model choices, continuity decisions |
| Mobile | At least review + approve checkpoints on phone |
| Testing | One golden short-film path that must keep working |

---

## Suggested near-term execution order (next 6–10 weeks)

1. **Phase 0** harden  
2. **Phase 1** Character Bible + Style Lock + Voice profile fields  
3. **Phase 2** Shot expander + Sequence skeleton  
4. **Phase 3** First video model + TTS path behind “Generate Shot”  
5. **Phase 4** Lightweight assembly + export package  
6. Only then push Autopilot checkpoints and multi-episode memory hard  

---

## Definition of success by horizon

| Horizon | Success looks like |
|---------|-------------------|
| 2–4 weeks | Best-in-class controlled script + continuity system |
| 6–8 weeks | Directed short (3–12 min) with video + voice under human checkpoints |
| 3 months | Reliable multi-scene pipeline + rough-cut export |
| Later | Series / long-form assembly with persistent memory |

---

## What you should *not* do yet

- Promise one-click 1-hour movies  
- Generate whole scenes in a single video call  
- Let video models invent character or plot without Director + Bible  
- Skip human checkpoints on long runs  
- Build a full NLE inside ScriptFlora before assembly basics work  

---

This process turns ScriptFlora into:

> **The Director’s desk for AI film**  
> ChatGPT plans and protects continuity.  
> Video + voice models execute under orders.  
> Humans approve the moments that matter.  
> Long-form is assembled, not wished into existence.

---
