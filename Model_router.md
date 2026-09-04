**Phase 3 Model Router — First Provider: Runway**

Use this as the concrete starting router for ScriptFlora.  
Director (ChatGPT) writes the shot brief.  
Router picks the model.  
Human still approves the result.

---

### 1. Router inputs (always required)

| Input | Source |
|-------|--------|
| Shot brief | From approved script / Auteur macro-state |
| Character refs | Locked Character Bible images |
| Style lock | World / Style node |
| Continuity notes | Previous shot state / Continuity Log |
| Priority | `draft` \| `balanced` \| `final` |
| Constraints | duration, aspect ratio, needs audio, needs identity lock |

---

### 2. Runway routing table (v1)

| Shot type | Priority | Route to (Runway) | Why |
|-----------|----------|-------------------|-----|
| **Draft / exploration** | draft | **Gen-4 Turbo** | Fast, cheaper, good for testing briefs |
| **Standard cinematic shot** | balanced / final | **Gen-4.5** | Flagship quality, text or image → video |
| **Character performance / acting** | balanced / final | **Act-Two** | Transfers motion/expression onto character ref |
| **Edit existing clip** (fix wardrobe, angle, style, object) | any | **Aleph 2.0** | Video-to-video edit without full regen |
| **Native audio preferred** | balanced / final | **Veo 3.1** or **Veo 3.1 Fast** | Strong cinematic + audio path via Runway |
| **Reference-heavy character lock** | final | **Seedance 2.5** (if available on Runway) | Strong multi-reference identity |
| **Fast social / vertical draft** | draft | **Gen-4 Turbo** or **Seedance Fast** | Speed over maximum fidelity |

Fallback rule:
- If preferred model fails / unavailable → fall back to **Gen-4.5**
- If cost ceiling hit → fall back to **Gen-4 Turbo**

---

### 3. Simple decision flow

```
Shot approved for generation
    ↓
Is this an edit of an existing clip?
    YES → Aleph 2.0
    NO
    ↓
Is priority = draft?
    YES → Gen-4 Turbo
    NO
    ↓
Is this a performance/acting shot with driving reference?
    YES → Act-Two
    NO
    ↓
Need native audio strongly?
    YES → Veo 3.1 (or Fast)
    NO
    ↓
Need maximum character identity lock?
    YES → Seedance 2.5 (if live) else Gen-4.5 + character refs
    NO
    ↓
Default → Gen-4.5
```

---

### 4. What ScriptFlora stores per generation

For every shot result:

- model_id (e.g. `gen4.5`, `gen4_turbo`, `aleph2`, `veo3.1`)
- provider (`runway`)
- full shot brief
- character ref IDs used
- style lock version
- continuity snapshot
- cost / credits
- status: generated → in_review → approved / rejected

This makes regen and debugging possible.

---

### 5. Voice path (parallel, not inside Runway only)

| Need | Path |
|------|------|
| Dialogue audio | Separate TTS / voice profile from Character Bible |
| Lip-sync | Optional post step when mouth is visible |
| Native model audio | Use only when router selected Veo/Seedance-with-audio and quality is acceptable |

Rule: **picture route and voice route can be independent**, then aligned in Sequence.

---

### 6. Phase 3 MVP scope (keep small)

1. Integrate **Runway API** as first provider  
2. Support these models first:
   - Gen-4 Turbo  
   - Gen-4.5  
   - Aleph 2.0  
3. Add Veo 3.1 / Seedance only after the basic route works  
4. Hard requirement: pass locked character image refs on every character shot  
5. No autopilot yet — one batch → human checkpoint

---

### 7. Success check for this router

- User can generate a 5–10 shot sequence using different Runway models by shot type  
- Character identity stays acceptable across approved shots  
- Rejected shots can be regenerated with the same brief + refs  
- Export still includes model provenance  

---

**Bottom line:**  
Runway gives you a real multi-model lane immediately.  
ScriptFlora stays the Director + continuity layer.  
Start narrow (Turbo / Gen-4.5 / Aleph), then expand the router map.
