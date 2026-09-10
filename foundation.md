# Script Flora — Foundation Stabilization

> Status: **complete** · Last updated: September 2026

---

## What this document covers

This is the engineering record for the Foundation Stabilization pass. Every item below maps to a concrete code change. Use it to orient new contributors and as acceptance criteria for QA.

---

## 1. Node text editing — cursor-jump bug

**Problem:** Typing inside a content node caused the cursor to snap back to the end after every keystroke. The root cause was that `onChange` called `update(id, {...})` → `setNodes` → full ReactFlow re-render on every keypress, destroying the browser's internal cursor position.

**Fix** (`components/nodes/content-node.tsx`):
- Added `localContent`, `localPrompt`, `localLabel` as `useState` draft values.
- All three editable fields (title input, prompt textarea, content textarea) now use local state and flush to the store only on `onBlur`.
- External updates from generation are synced back via `useEffect` with ref-based guards so the local draft is only overwritten when the store value actually changes from outside.
- "Run prompt" button flushes `localPrompt` to the store before triggering regenerate so the API always receives the latest value.

---

## 2. Long-form / feature-film generation (token limit handling)

**Problem:** A single API call cannot produce a full 2-hour film script — output token limits cut it short.

**Architecture** (`app/api/generate/route.ts` + `components/canvas/script-flow-canvas.tsx`):

1. `parseDurationMinutes(duration)` parses any human string — "2 hours", "90 min", "120s" — into minutes.
2. `sceneCountForDuration(minutes)` scales beat count linearly: short-form ~1.5 beats/min, feature film ~1 beat/8 min, ceiling 60.
3. If duration > 10 min and skill ≠ `auteur`, the API returns a `ChunkingPlan` instead of a `GenerationPlan`:
   ```json
   { "needsChunking": true, "totalScenes": 24, "durationMinutes": 120, "chunks": [{...}], "generationId": "..." }
   ```
4. The canvas `handleGenerate` detects `needsChunking` and fires sequential chunk requests (`chunkIndex` / `chunkTotal` / `totalScenes` in the body), collecting all stages.
5. A single `reconcile()` pass merges all chunks into the node graph at the end.

**Result:** A 2-hour film request produces ~15-30 chunk calls, each within normal token limits. Generation resumes exactly where the previous chunk stopped. The UI shows "Generating…" throughout.

---

## 3. Generation modes (Brief node)

Four modes added to `BriefNodeData` and exposed in the Brief node UI:

| Mode | Behaviour |
|---|---|
| **Standard** | Single-pass, short-form (default) |
| **Long-form** | Triggers chunked generation; extended scene detail |
| **Series / Season** | Episode-arc framing; character/world continuity notes injected |
| **Set-by-set** | Each scene written to fit a configurable AI video generation window (default 10 s, range 5–30 s) |

The Brief node shows a "Seconds per AI generation window" number input when set-by-set is selected.

The selected mode is injected into `additionalNotes` before the API call so the model honours it without schema changes.

---

## 4. Series skill

**Problem:** `series-script.md` existed in `public/skills/` but was never exposed in the Skill node's built-in picker.

**Fix** (`components/nodes/skill-node.tsx`): Added `series` as a third built-in alongside `standard` and `auteur`. The API now loads `series-script.md` when `skill === 'series'`.

---

## 5. Lock / regen reliability

**Problem:** `regenerateSingleNode` checked `d.locked` but not `d.approved`, so approved nodes could be silently overwritten.

**Fix** (`components/canvas/script-flow-canvas.tsx`):
- Guard is now `if (d.locked || d.approved) return`.
- Node prompt (`d.prompt`) is explicitly forwarded as a `Node prompt override:` line in `additionalNotes` so the model sees the per-node instruction.
- `reconcile()` already skipped locked/approved nodes in the full-pipeline path — no change needed there.

---

## 6. Continuity node — inline conflict resolution

**Problem:** The continuity node listed issues but offered no way to act on them.

**Fix** (`components/nodes/continuity-node.tsx`):

Each issue now has two inline actions:

- **Flag for edit** — calls `__ScriptFloraUpdateNode` (exposed on `window` by the canvas) to set the relevant content node's status to `error`, making it visually obvious which scene needs fixing. For key-fact issues all unlocked/unapproved content nodes are flagged.
- **Dismiss** — removes the issue from the visible list without re-running the check.

A **Re-run check** button appears after the first run so users can verify their fixes without scrolling to the toolbar.

Dismissed issues reset on each new check run.

---

## 7. Edge / connection deletion

**Problem:** `deleteKeyCode={null}` disabled ReactFlow's default deletion, and there was no other way to remove connections.

**Fix** (`components/canvas/script-flow-canvas.tsx`):
- The keyboard `Delete` / `Backspace` handler now calls `setEdges((c) => c.filter((e) => !e.selected))` before removing nodes.
- `edgesUpdatable` and `edgesFocusable` added to `<ReactFlow>` so edges can be clicked to select them.
- Help overlay updated: `Delete / ⌫` → *"Delete selected nodes or edges (locked nodes are skipped)"*.

**How to disconnect:** click an edge to select it (it highlights), then press `Delete` or `Backspace`.

---

## 8. Node prompt feature audit

All nodes reviewed:

| Node | Prompt feature | Status |
|---|---|---|
| Brief | "Generate Brief from idea" + "Improve Brief" modal | ✅ working — modal calls `/api/generate-brief` |
| Skill | Dropdown selects skill markdown | ✅ working — markdown passed to API |
| Content | Prompt textarea + "Run prompt" button | ✅ fixed — prompt now flushed to store before regen; passed as `additionalNotes` override |
| Continuity | "Run check" / "Re-run check" button | ✅ working |
| Output | Format toggles + download | ✅ working |
| Export | Format picker + filename + notes toggle | ✅ fixed (see §9) |

---

## 9. Export quality

**Problem:** `buildMarkdown` in `export-node.tsx` produced identical plain markdown regardless of the selected format (Fountain, FDX, DOCX, PDF all looked the same).

**Fix** (`components/nodes/export-node.tsx`) — `buildExport(format, nodes, includeNotes)`:

| Format | Output |
|---|---|
| **Markdown** | Structured screenplay markdown with brief metadata header |
| **Fountain** | Proper [Fountain](https://fountain.io) plain-text format — `INT./EXT.` scene headings, speaker-tagged dialogue, transition blocks |
| **Final Draft (.fdx)** | Well-formed Final Draft XML (`<FinalDraft>` schema); imports via File → Import in FD 11+ |
| **PDF** | Downloads as `.md` with a conversion note: *"Open in Typora / Notion and export to PDF"* |
| **Word (.docx)** | Downloads as `.md` with Pandoc command: `pandoc script.md -o script.docx` |

PDF and DOCX show an inline info badge explaining the limitation. True server-side rendering (Puppeteer for PDF, `docx` npm for DOCX) is the upgrade path — `ponytail:` comment marks the ceiling in code.

The "Include visual / production notes" toggle now correctly excludes `visual` and `auteur-production-summary` nodes from Fountain/Markdown output when off.

---

## Files changed

| File | Change |
|---|---|
| `lib/flow-types.ts` | Added `SkillId.series`, `BriefNodeData.generationMode`, `BriefNodeData.secondsPerSet`, `ChunkingPlan` type, `GENERATION_MODE_OPTIONS` const |
| `app/api/generate/route.ts` | Long-form chunking plan logic; `series-script.md` loading; chunk system prompt injection |
| `components/nodes/content-node.tsx` | Local draft state to fix cursor-jump bug |
| `components/nodes/brief-node.tsx` | Generation mode + set-by-set controls |
| `components/nodes/skill-node.tsx` | Series added as built-in skill |
| `components/nodes/continuity-node.tsx` | Inline issue resolution (Flag for edit / Dismiss / Re-run) |
| `components/nodes/export-node.tsx` | Format-aware export: Fountain, FDX XML, MD, PDF/DOCX fallback |
| `components/canvas/script-flow-canvas.tsx` | Edge deletion, approved-node regen guard, prompt forwarding, chunked generation loop, `__ScriptFloraUpdateNode` global, generation mode notes injection |

---

## Known ceilings (upgrade paths)

- **PDF / DOCX export** — needs server-side rendering (Puppeteer / `docx` library). Current: markdown download with instructions.
- **Chunked generation progress** — UI shows a static "Generating…" during multi-chunk runs. Upgrade: stream chunk progress percentage to a progress bar via SSE.
- **Set-by-set scene sizing** — scene length is enforced via prompt instruction only; no mechanical word-count trimmer. Upgrade: post-process each stage and split at the target word count.
- **Continuity auto-fix** — "Flag for edit" only marks nodes; it doesn't rewrite content. Upgrade: add an AI-assisted inline rewrite using the issue message as the correction prompt.
- **Series episode memory** — episode-to-episode continuity relies on the user copying Character Bible / Episode Recap into `additionalNotes`. Upgrade: dedicated Episode Memory node that auto-appends to each new episode brief.
