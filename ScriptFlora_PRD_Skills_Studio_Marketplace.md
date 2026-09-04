# Product Requirements Document (PRD)
## ScriptFlora — Skills Studio & Skills Marketplace

**Version:** 1.0  
**Status:** Proposed  
**Parent PRD:** ScriptFlora PRD v3.2  
**Core principle:** Create with AI. Review with humans.  
**Related systems:** Skill manifests, node provenance, version pinning, core vs skill ownership

---

## 1. Document Control

| Item | Detail |
|------|--------|
| Product area | Skills Studio + Skills Marketplace |
| Parent product | ScriptFlora (Director’s desk for AI film) |
| Depends on | Brief confirm gate, core nodes, skill node provenance, Continuity API |
| Out of scope (v1 marketplace) | Unrestricted code execution, unpaid public spam skills, replacing core continuity nodes |

---

## 2. Summary

ScriptFlora skills are reusable Director pipelines.  
They are not limited to script generation.

This PRD defines two connected surfaces:

1. **Skills Studio** — create, version, test, and publish skills  
2. **Skills Marketplace** — discover, install, pin, and update skills

Together they turn ScriptFlora from a fixed-pipeline product into a **platform for Director workflows**, while keeping continuity and human control under system ownership.

---

## 3. Problem

Today ScriptFlora ships first-party skills (Standard, Auteur, Series). That is enough for launch, but:

- Filmmakers and educators need domain-specific pipelines
- Style/structure/packaging workflows repeat across projects
- Hard-coding every pipeline does not scale
- Teams want shareable methods, not only one-off prompts
- A marketplace without Studio (authoring + test) becomes low-quality quickly

Without a disciplined skill system, extensibility becomes either frozen product work or unsafe plugin chaos.

---

## 4. Goals

### Goals
- Allow creation of skills across families: script, style, structure, packaging, domain
- Provide safe test runs isolated from real project continuity
- Support version pinning per project
- Enable internal packs first, then team sharing, then public marketplace
- Preserve core node ownership and continuity enforcement
- Make skills installable without breaking existing projects

### Non-goals (near term)
- Arbitrary third-party JavaScript execution in the canvas
- Fully automatic publish without review gates
- Replacing Character Bible / Style Lock / Continuity Log with marketplace nodes
- Complex commerce multi-currency enterprise billing in v1

---

## 5. Definitions

| Term | Meaning |
|------|---------|
| **Skill** | Versioned Director pipeline with manifest, instructions, recipes, permissions |
| **Skill family** | Category: script, style, structure, packaging, domain |
| **Manifest** | Machine-readable skill definition |
| **Recipe** | Declared node graph the skill spawns |
| **Skills Studio** | Authoring + testing workspace |
| **Marketplace** | Discovery/install surface for skills |
| **Pin** | Project locks a specific skill version |
| **Core node** | System-owned node (Brief, Bible, Style Lock, Continuity, Sequence, Generate, Checkpoint, HyperFrames) |
| **Skill node** | Node spawned by a skill, with provenance |

---

## 6. Skill families

Skills are broader than script skills.

| Family | Purpose | Example outputs |
|--------|---------|-----------------|
| **Script** | Narrative/script generation | Scenes, dialogue, macro-states |
| **Style** | Look / visual language | Style Pack draft, constraints, refs |
| **Structure** | Format templates | Ad 30s, lesson module, trailer beats |
| **Packaging** | Finishing defaults | HyperFrames template prefs, caption rules |
| **Domain** | Vertical workflows | Theater scene study, training module, product demo |

A project may run one or multiple skills (e.g. Series script skill + Noir style skill + Social packaging skill), subject to compatibility rules.

---

## 7. Core vs skill ownership (non-negotiable)

| System-owned (core) | Skill may propose / generate |
|---------------------|------------------------------|
| Brief node + confirm gate | Draft brief content |
| Character Bible | Character suggestions (human locks) |
| Style Lock | Style Pack drafts |
| Continuity Log | Continuity patches via official API only |
| Generate Shot + router entry | Model preference hints |
| Checkpoint | — |
| Sequence shell | Ordered suggestions |
| HyperFrames node | Template defaults / variable maps |

Skills cannot silently replace core enforcement.

---

## 8. Skills Studio (Authoring)

### 8.1 Purpose
Enable trusted authors (initially first-party / team) to build and verify skills before install.

### 8.2 Studio surfaces

| Surface | Function |
|---------|----------|
| **Skill list** | Drafts, published, archived |
| **Manifest editor** | Metadata, family, inputs, permissions |
| **Instructions editor** | Director system/prompt logic for the skill |
| **Recipe builder** | Node types, order, dependencies, defaults |
| **Test runner** | Sandbox project execution |
| **Version manager** | Semver, changelog, pin guidance |
| **Publish panel** | Internal / team / public targets |

### 8.3 Skill creation flow

```
Create skill
  → Choose family
  → Define required inputs (Brief, Bible, Style, assets…)
  → Write Director instructions
  → Define node recipe
  → Set permissions
  → Run test project
  → Review outputs + warnings
  → Save version
  → Publish to allowed channel
```

### 8.4 Test Project (sandbox)

Every skill must be testable in isolation:

- Creates ephemeral test project
- Requires temporary Brief (upload or generate allowed)
- Optional Character/Style locks for realistic tests
- Spawns recipe nodes
- Marks all outputs as `origin: test`
- **Does not write** to any real project Continuity Log
- Allows side-by-side compare of versions

### 8.5 Versioning rules

- Semantic versions: `MAJOR.MINOR.PATCH`
- Project installs pin an exact version by default
- Updating a skill in marketplace does not auto-mutate existing projects
- Breaking recipe/permission changes require MAJOR bump
- Changelog required for publish

---

## 9. Skill Manifest (minimum schema)

```json
{
  "id": "publisher.skill-slug",
  "version": "1.2.0",
  "name": "Noir Auteur Short",
  "family": "script",
  "description": "Dialogue-heavy noir short structure with style bias",
  "publisherId": "scriptflora",
  "requires": {
    "app": ">=3.2.0",
    "inputs": ["brief"],
    "locks": ["style"],
    "optionalInputs": ["characterBible", "assets"]
  },
  "permissions": [
    "read:brief",
    "read:bible",
    "read:style",
    "write:skill_nodes"
  ],
  "createsNodes": [
    { "key": "hook", "type": "script.hook" },
    { "key": "scenes", "type": "script.scene", "count": "auto" },
    { "key": "macro_states", "type": "script.macro_state", "count": "auto" }
  ],
  "modelPreferences": {
    "video": ["gen4.5", "seedance2_5"],
    "voice": ["character_voice"]
  },
  "packagingDefaults": {
    "hyperframesTemplate": null
  },
  "changelog": "Improved scene continuity notes"
}
```

### Permission catalog (v1)

| Permission | Allows |
|------------|--------|
| `read:brief` | Read confirmed brief |
| `read:bible` | Read character bible |
| `read:style` | Read style lock / packs |
| `read:assets` | Read project assets |
| `write:skill_nodes` | Create/update skill-origin nodes |
| `write:continuity_patch` | Submit continuity patches via API |
| `suggest:model_route` | Suggest model preferences |
| `suggest:packaging` | Suggest HyperFrames template/vars |

Denied by default unless declared and approved.

---

## 10. Runtime behavior on canvas

When user selects an installed skill in a real project:

```
Validate Brief confirmed
  → Validate required locks/inputs
  → Check permissions
  → Spawn recipe nodes with provenance
  → Director executes skill instructions + project context
  → Outputs land in skill nodes
  → Continuity changes only via Continuity API
  → User reviews/locks nodes as usual
```

### Provenance on every skill node

```ts
{
  origin: "skill",
  skillId: string,
  skillVersion: string,
  skillNodeKey: string,
  publisherId: string
}
```

### Stale handling
If skill has a newer version:
- Locked nodes remain unchanged
- Unlocked skill nodes may show `staleReason: "skill_update"`
- Regen uses pinned version unless user explicitly upgrades pin

---

## 11. Skills Marketplace

### 11.1 Purpose
Discover and install skills into a user/team library, then pin them into projects.

### 11.2 Rollout stages (mandatory sequence)

| Stage | Scope | Who can publish | Who can install |
|-------|-------|-----------------|-----------------|
| **M0** | Manifest format only | First-party engineering | Built-in |
| **M1** | Internal skill packs | ScriptFlora team | All users (first-party) |
| **M2** | Team marketplace | Team admins / approved authors | Team members |
| **M3** | Public marketplace | Verified publishers | All users |

Do not open M3 before M0–M2 quality and permission systems work.

### 11.3 Marketplace surfaces

| Surface | Function |
|---------|----------|
| Browse / search | By family, popularity, verified status |
| Skill detail | Description, permissions, screenshots, changelog, publisher |
| Install | Add to library at specific version |
| Manage installs | Update available, uninstall, permissions review |
| Publisher profile | (M2/M3) identity + verification state |

### 11.4 Install flow

```
Browse skill
  → Review permissions + required inputs
  → Install version
  → Appears in Skill Selector
  → On project use, pin version to project
```

### 11.5 Trust tiers

| Tier | Meaning |
|------|---------|
| **Official** | ScriptFlora first-party |
| **Verified** | Reviewed publisher |
| **Community** | Available but clearly labeled; limited permissions possible |

UI must always show tier + requested permissions before install.

---

## 12. Commerce (optional layered)

Not required for M1.

Possible later models:
- Free skills
- One-time purchase
- Publisher subscription share
- Team-licensed packs

v1 can ship with free official + team-shared skills only.

---

## 13. Integration with existing ScriptFlora flow

```
Brief (confirm)
  → Optional style/domain skill
  → Script skill
  → Character + Style locks
  → Skill-generated script/structure nodes
  → Shots / generate / checkpoints
  → Sequence
  → Packaging skill defaults (optional)
  → HyperFrames
  → Export
```

Skills enhance the flow; they do not bypass Confirm Brief or checkpoints.

---

## 14. Functional requirements

### Skills Studio
- Create/edit skill drafts
- Define family, manifest, instructions, recipes, permissions
- Run isolated test projects
- Version + changelog
- Publish to allowed stage channel

### Runtime
- Install skills to library
- Pin versions on project
- Spawn provenance-bearing nodes
- Enforce permissions
- Support multi-skill projects with conflict warnings

### Marketplace
- Browse/search by family and trust tier
- Skill detail + permissions disclosure
- Install/uninstall
- Update notifications (non-destructive)

### Safety
- Continuity writes only through Continuity API
- Core nodes cannot be overridden by skill recipes
- Test outputs isolated
- Permission review on install

---

## 15. Non-functional requirements

- Skill manifests stored as versioned artifacts
- Backward compatibility for pinned versions
- Audit log for publish/install/permission grants (team/public stages)
- Performance: skill spawn should not block canvas interactivity
- Clear error states for missing required inputs/locks

---

## 16. UX requirements (minimum)

### Skill Selector (project)
- Installed skills list by family
- Required inputs/locks indicators
- Pin version visible
- “Tested with your Brief” status when possible

### Studio
- Recipe preview graph
- Permission checklist
- Test run console (warnings, spawned nodes, blocked actions)

### Marketplace detail page
- What this skill does
- What it can access
- What it cannot do
- Versions / changelog
- Install CTA

---

## 17. Analytics / success metrics

| Metric | Why |
|--------|-----|
| Skills installed per active user | Adoption |
| Skill run success rate | Quality |
| Test-before-publish rate | Author discipline |
| Permission reject rate | Trust friction signal |
| Pinned-version upgrade rate | Stability vs freshness |
| Multi-skill project rate | Platform value |

---

## 18. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Low-quality public skills | Staged rollout; verified tiers; review |
| Continuity corruption | Continuity API only; no direct state mutation |
| Project breakage on update | Default pin + explicit upgrade |
| Permission overreach | Least-privilege defaults; disclosure UI |
| Node sprawl | Recipe limits; pack templates; family labels |
| Scope explosion into plugin OS | No arbitrary code exec in v1 |

---

## 19. Phased delivery plan

### Phase S0 — Foundation
- Manifest schema finalized
- Provenance fields on skill nodes
- Project skill pinning
- Built-in skills migrated to manifests

### Phase S1 — Skills Studio (internal)
- Authoring UI for first-party
- Test sandbox
- Versioning + changelog
- Internal publish

### Phase S2 — Team sharing (M2)
- Team library
- Author roles
- Install permissions review
- Audit basics

### Phase S3 — Public marketplace (M3)
- Public browse
- Verified publishers
- Trust tiers
- Optional commerce later

---

## 20. Acceptance criteria

### Studio
- [ ] Author can create a skill with manifest + recipe + instructions
- [ ] Test run spawns expected nodes in sandbox
- [ ] Test run cannot mutate real project continuity
- [ ] Versions are immutable after publish

### Runtime
- [ ] Installed skill appears in selector
- [ ] Project pins exact version
- [ ] Spawned nodes include provenance
- [ ] Missing required locks block run with clear error

### Marketplace
- [ ] User can browse by family
- [ ] Permissions are visible before install
- [ ] Install/uninstall works
- [ ] Update does not auto-change pinned projects

### Safety
- [ ] Skill cannot replace core nodes
- [ ] Continuity writes only via API
- [ ] Community/public skills clearly labeled by tier

---

## 21. Open questions

1. Who can author in M2 by default: all team members or approved authors only?
2. Should style skills write Style Pack drafts only, or also propose temporary Style Lock values?
3. Max nodes a single skill recipe may spawn in v1?
4. Do packaging skills only suggest HyperFrames templates, or can they auto-attach a HyperFrames node?

---

## 22. Positioning

**Skills Studio** is where Director methods are built and proven.  
**Skills Marketplace** is where those methods are distributed and reused.

ScriptFlora remains the system of record for continuity and approval.  
Skills are how the ecosystem extends creative process — safely.

---

*End of PRD — Skills Studio & Skills Marketplace v1.0*
