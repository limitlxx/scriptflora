# ScriptFlora Production Implementation Plan

## Objective

Evolve the current ScriptFlora prototype into a production-ready script generation platform where a connected brief and skill produce a complete, skill-specific story graph. The system must support as many generated stages as the selected skill and brief require—not only one scene—and must preserve user-authored work during reruns.

## Phase 1: Domain and Graph Contract

- Define the canonical generation request: project, brief, selected skill, connected stages, output format, tone, duration, and constraints.
- Define the canonical generation plan: ordered stages, branches, stage keys, sequence indexes, prompts, content, and provenance.
- Extend shared types with pipeline identity, stage key, generation ID, source skill, and edit provenance where needed.
- Document which stage types each skill can produce and how each stage connects.
- Define immutable IDs and deterministic reconciliation keys.

## Phase 2: Backend Generation Service

- Create a server-side generation endpoint or server action.
- Validate all request fields and reject generation without a valid brief-to-skill connection.
- Implement skill-specific planning that determines the complete story structure from the brief.
- Infer repeated hooks, scenes, dialogue, visual beats, transitions, CTAs, and supporting nodes from duration, audience, tone, constraints, format, and requested output.
- Return structured JSON matching the generation plan schema rather than unstructured text.
- Add timeouts, retries, idempotency, cancellation, and generation IDs.
- Keep provider credentials and model calls server-side.

## Phase 3: Graph Reconciliation

- Find the selected skill node and verify its connected brief.
- Scope reconciliation to the selected skill pipeline.
- Match existing generated stages by `skillId + stageKey + index`.
- Update existing connected stages in place.
- Preserve locked nodes and nodes marked as manually edited.
- Add missing nodes for newly required stages.
- Do not delete unrelated, unconnected, locked, or manually authored nodes.
- Remove or archive obsolete generated nodes only through an explicit user action or a documented cleanup policy.
- Ensure generated content nodes fan out directly from the skill node unless the plan explicitly defines a branch relationship.
- Preserve downstream continuity, output, and export connections.

## Phase 4: Frontend Generation UX

- Replace the simulated generation trigger with the production generation request.
- Show a clear preflight state when no valid brief-to-skill path exists.
- Display generation progress by stage and support partial completion.
- Mark all participating edges as flowing during generation.
- Prevent duplicate submissions while a generation is active.
- Support retry from the failed generation ID.
- Prevent stale responses from replacing newer edits.
- Show which nodes were created, updated, preserved, or skipped because they were locked.
- Keep existing node actions—lock, approve, regenerate, duplicate, and delete—consistent with the persistence model.

## Phase 5: Persistence and Versioning

- Persist projects, graph nodes, graph edges, briefs, skill configuration, and generation runs.
- Store generated plan snapshots for auditability and rollback.
- Add optimistic concurrency protection for simultaneous edits.
- Save manual edits separately from generated content or record edit provenance.
- Add draft, approved, and published lifecycle states.
- Add export snapshots so exported scripts match a known graph version.

## Phase 6: Security and Reliability

- Authenticate project access and authorize every project-scoped read/write.
- Validate and sanitize user input on the server.
- Apply rate limits and generation quotas.
- Never expose model keys or internal prompts to the browser.
- Add structured logs with project ID, generation ID, skill, stage count, duration, and failure reason.
- Add monitoring for failed generations, latency, malformed plans, and reconciliation conflicts.
- Add baseline security headers in the Next.js configuration.

## Phase 7: Testing Strategy

### Unit tests

- Brief-to-skill connection validation.
- Skill-specific plan decomposition.
- Repeated stage inference.
- Deterministic reconciliation keys.
- Fan-out edge generation.
- Locked and manually edited node preservation.
- Unrelated pipeline isolation.
- Stale generation response rejection.

### Integration tests

- Generate a standard script from a connected brief.
- Generate an auteur script with premise, tension, turn, and resonance.
- Rerun generation with existing stages.
- Add new scenes without duplicating existing stages.
- Continue generated content through continuity, output, and export.
- Recover from partial or failed generation.

### Browser acceptance tests

- Connect brief to skill and generate.
- Confirm multiple generated nodes appear.
- Confirm every generated content node fans out from the skill node.
- Confirm locked content remains unchanged.
- Confirm mobile and desktop canvas layouts remain usable.

## Phase 8: Release Readiness

- Complete type-checking, linting, unit tests, integration tests, and production build.
- Verify environment variables and server integration configuration.
- Run browser verification against the production-like preview.
- Confirm analytics, monitoring, backups, and rollback procedures.
- Document API contracts, graph schema, skill behavior, operational runbooks, and known limitations.
- Release behind a feature flag, validate with representative briefs, then enable progressively.

## Acceptance Criteria

1. Generation cannot start without a connected brief and selected skill.
2. The selected skill determines the complete generated node structure.
3. The plan can contain multiple hooks, scenes, dialogue blocks, visual directions, CTAs, or skill-specific stages.
4. Generated content nodes connect directly to the skill node when the skill defines fan-out output.
5. Existing connected stages are updated in place and missing stages are added.
6. Locked and manually edited nodes are never overwritten.
7. Reruns do not duplicate equivalent generated stages.
8. Unrelated pipelines are not modified.
9. Generation failures are visible, retryable, and logged.
10. A completed graph can proceed through continuity, output, and export.
