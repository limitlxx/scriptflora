# The Director Method — ScriptFlora

## Core principle
**Create with AI. Review with humans.**

ChatGPT is the Director — it plans, structures, and enforces continuity.
Video and voice models are crew — they execute under strict briefs and character references.
Humans approve every moment that matters.

## Canonical production order
1. Brief (text) — optionally uploaded from a draft doc
2. Character Bible (text) → character reference images (lock)
3. World / Style Lock (text) → optional Style Pack from references
4. Script via skill pipeline (text nodes)
5. Shot plan derived from script (text)
6. Storyboard stills for key shots (images)
7. Video + voice per shot (media)
8. Sequence assembly (rough cut)
9. HyperFrames packaging → designed deliverable
10. Export package → finishing in external NLE or publish

## Hard rules
1. ChatGPT is the Director — plans, structures, enforces continuity, writes briefs.
2. Video and voice models are crew — they execute under strict briefs and character references.
3. Human checkpoints are mandatory for anything beyond short clips.
4. Generate small units (shots / macro-states), then assemble. Never one-shot long-form.
5. Character images must be locked before video generation is allowed for that character.
6. Media generation never precedes an approved script path.
7. Locked nodes/items are never overwritten unless explicitly unlocked by the user.
8. Skills cannot replace core system nodes (Brief, Bible, Style Lock, Continuity Log, Sequence, Generate Shot, Checkpoint, HyperFrames).
9. Continuity writes must go through the Continuity API — never direct state mutation.

## What ScriptFlora is NOT
- Not a one-click 1-hour movie maker
- Not a whole-scene single video call tool
- Not a way to let models invent characters without Director + Bible
- Not a replacement for human checkpoints on long runs
- Not a full NLE (it produces export packages for external tools)
