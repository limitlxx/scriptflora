# ScriptFlora Frontend Documentation

## Overview

ScriptFlora is a node-based scriptwriting canvas built with Next.js 16, React 19, TypeScript, Tailwind CSS v4, and React Flow. The frontend lets users connect a brief to a writing skill, generate a complete skill-specific story plan, review generated content, and route the result through continuity, output, and export stages.

## Application Structure

- `app/page.tsx` — landing page.
- `app/canvas/page.tsx` — full-screen writing canvas route.
- `app/projects/page.tsx` — project dashboard.
- `components/canvas/script-flow-canvas.tsx` — React Flow orchestration, graph state, generation, reconciliation, and node actions.
- `components/canvas/top-bar.tsx` — project controls and generation entry point.
- `components/canvas/add-node-menu.tsx` — add-node interactions.
- `components/canvas/canvas-controls.tsx` — zoom and viewport controls.
- `components/nodes/*` — node-specific presentation and actions.
- `lib/flow-types.ts` — shared graph, node, content-kind, and status types.
- `lib/initial-graph.ts` — initial graph data and default edges.

## Core User Flow

1. Create or edit a brief.
2. Select a skill node (`standard` or `auteur`).
3. Connect the brief to the skill.
4. Click Generate.
5. Generate downstream stage nodes based the skill.
6. Validate that the selected skill has a connected brief.
7. Decompose the brief according to the selected skill and requested output.
8. Reconcile existing connected stages without overwriting locked or manually edited nodes.
9. Add missing nodes for all required hooks, premises, scenes, dialogue, visuals, turns, CTAs, and other skill stages.
10. Fan out generated content nodes directly from the skill node, unless a skill-specific branch explicitly requires another relationship.
11. Route completed content into continuity, output, and export nodes.

## Generation Contract

The selected skill is the source of truth for the generated structure. Generation must not use a fixed scene-only template. The generated plan should provide all nodes required to tell a complete story script, including repeated nodes where the brief requires them.

Examples:

- `standard`: hooks, scenes, dialogue, visual directions, and CTA.
- `auteur`: premise, tension, turn, and resonance, with repeated supporting content where appropriate.
- Short-form social content may require multiple hooks and a compact scene sequence.
- Longer narrative briefs may require more scenes, dialogue blocks, visual beats, transitions, and a closing CTA.

## Graph State Rules

- Use React Flow nodes and edges as the source of truth for the canvas.
- Use stable IDs and stage metadata for reconciliation.
- Match generated nodes by pipeline, skill, content kind, and sequence/index—not by content kind alone.
- Preserve locked nodes and manually edited content.
- Preserve unrelated or unconnected pipelines.
- Update existing connected generated stages in place.
- Add only missing stages.
- Generated content nodes should connect directly to the selected skill node for fan-out behavior.
- Mark participating edges as flowing while generation is active.
- Set generated nodes to `draft` when complete and `error` when generation cannot proceed.

## Accessibility and Interaction

- Use semantic buttons and labels for all controls.
- Keep keyboard focus visible.
- Provide accessible names for icon-only actions.
- Do not rely on color alone for status or selection.
- Keep generated content readable at desktop and mobile canvas sizes.
- Respect locked-node state in all mutation handlers.

## Production Frontend Requirements

- Replace simulated generation with a server-backed generation endpoint or server action before launch.
- Validate brief, skill, and output configuration on the server.
- Add loading, error, retry, and cancellation states.
- Persist graph changes and version generated plans.
- Add optimistic updates only where rollback is reliable.
- Track generation IDs so stale responses cannot overwrite newer graph state.
- Add automated tests for reconciliation, fan-out edges, locked nodes, reruns, and unrelated pipelines.
- Add error monitoring and structured client/server logging.
- Verify the canvas in responsive desktop and mobile viewports before release.

## Local Development

Install dependencies with pnpm, then run the Next.js development server. The production build is the required pre-release validation step.

```bash
pnpm install
pnpm dev
pnpm build
```

## Definition of Done

A frontend release is ready when a connected brief and skill can generate a complete skill-specific script graph, repeated stages are represented correctly, generated content fans out from the skill, manual and locked nodes remain safe, and the resulting graph can continue through continuity, output, and export stages without errors.
