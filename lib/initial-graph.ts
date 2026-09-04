import type { ScriptFloraEdge, ScriptFloraNode } from './flow-types'
import { CONTENT_NODE_CONTRACTS, SKILL_MANIFESTS } from './flow-types'

const edge = (
  source: string,
  target: string,
  flowing = false,
): ScriptFloraEdge => ({
  id: `${source}->${target}`,
  source,
  target,
  type: 'smoothstep',
  animated: false,
  data: { flowing },
})

// Phase 8: provenance for all standard-skill demo nodes
const standardProvenance = {
  skillId: SKILL_MANIFESTS.standard.skillId,
  skillVersion: SKILL_MANIFESTS.standard.version,
  publisherId: SKILL_MANIFESTS.standard.publisherId,
}

export const initialNodes: ScriptFloraNode[] = [
  {
    id: 'brief-1',
    type: 'brief',
    position: { x: 0, y: 96 },
    data: {
      title: 'Aperture — Series Launch',
      objective:
        'Introduce the Aperture camera brand through a retired cinematographer discovering an emotional commission. Land the product in the final six seconds.',
      audience: 'Film-literate adults, 28–45',
      platforms: ['YouTube', 'Instagram'],
      duration: '90s',
      tone: 'cinematic',
      keyFacts: [
        'No voiceover — dialogue only',
        'Single location throughout',
        'Product reveal in final 6 seconds',
      ],
      additionalNotes: 'Practical red-light darkroom aesthetic throughout.',
      status: 'draft',
      origin: 'core',
    },
  },
  {
    id: 'skill-1',
    type: 'skill',
    position: { x: 468, y: 168 },
    data: {
      selected: 'standard',
      origin: 'core',
    },
  },
  {
    id: 'hook-1',
    type: 'content',
    position: { x: 900, y: 0 },
    data: {
      kind: 'hook',
      label: 'Hook',
      stageKey: 'standard:hook',
      content:
        'Black. A lens cap turns — the sound of it fills the room. Light spills across a face that has spent forty years behind the camera and none of it in front.',
      status: 'approved',
      approved: true,
      locked: true,
      tokens: 412,
      origin: 'skill',
      provenance: { ...standardProvenance, skillNodeKey: 'hook' },
      contract: CONTENT_NODE_CONTRACTS['hook'],
    },
  },
  {
    id: 'scene-1',
    type: 'content',
    position: { x: 900, y: 250 },
    data: {
      kind: 'scene',
      label: 'Scene',
      index: 1,
      stageKey: 'standard:scene:1',
      content:
        'INT. DARKROOM — DUSK\n\nMARGOT (68) works under red light, hands steady in a way the rest of her is not. Contact sheets hang like laundry. She stops at one frame and does not move.',
      status: 'draft',
      tokens: 688,
      origin: 'skill',
      provenance: { ...standardProvenance, skillNodeKey: 'scene' },
      contract: CONTENT_NODE_CONTRACTS['scene'],
    },
  },
  {
    id: 'dialogue-1',
    type: 'content',
    position: { x: 900, y: 520 },
    data: {
      kind: 'dialogue',
      label: 'Dialogue',
      index: 1,
      stageKey: 'standard:dialogue:1',
      content:
        'MARGOT\nI shot four hundred weddings. I never once looked at the mothers.\n\nELISE\nSo look now.',
      status: 'generating',
      tokens: 0,
      origin: 'skill',
      provenance: { ...standardProvenance, skillNodeKey: 'dialogue' },
      contract: CONTENT_NODE_CONTRACTS['dialogue'],
    },
  },
  {
    id: 'visual-1',
    type: 'content',
    position: { x: 900, y: 772 },
    data: {
      kind: 'visual',
      label: 'Visual Directions',
      index: 1,
      stageKey: 'standard:visual:1',
      content:
        'Handheld, 40mm, practical red only. Let the grain stay. Cut on the blink, never on the line.',
      status: 'draft',
      tokens: 219,
      origin: 'skill',
      provenance: { ...standardProvenance, skillNodeKey: 'visual' },
      contract: CONTENT_NODE_CONTRACTS['visual'],
    },
  },
  {
    id: 'cta-1',
    type: 'content',
    position: { x: 900, y: 1004 },
    data: {
      kind: 'cta',
      label: 'Call to Action',
      stageKey: 'standard:cta',
      content: 'Aperture. Some things deserve to be looked at properly.',
      status: 'draft',
      tokens: 96,
      origin: 'skill',
      provenance: { ...standardProvenance, skillNodeKey: 'cta' },
      contract: CONTENT_NODE_CONTRACTS['cta'],
    },
  },
  {
    id: 'continuity-1',
    type: 'continuity',
    position: { x: 1330, y: 300 },
    data: {
      status: 'draft',
      score: 88,
      checkedAt: '2 min ago',
      origin: 'core',
      issues: [
        {
          id: 'i1',
          severity: 'warning',
          message:
            'Margot is described as 68 in Scene 1 but "forty years behind the camera" implies she started at 28 — verify against the brief.',
          source: 'scene-1',
        },
        {
          id: 'i2',
          severity: 'warning',
          message:
            'Elise speaks in Dialogue but is never introduced in a scene heading.',
          source: 'dialogue-1',
        },
        {
          id: 'i3',
          severity: 'info',
          message:
            'Brief forbids voiceover. No violations detected in current draft.',
          source: 'brief-1',
        },
      ],
    },
  },
  {
    id: 'output-1',
    type: 'output',
    position: { x: 1330, y: 690 },
    data: {
      status: 'draft',
      origin: 'core',
      formats: [
        { id: 'screenplay', label: 'Screenplay', description: 'Industry-standard scene formatting', enabled: true },
        { id: 'shotlist', label: 'Shot list', description: 'One row per shot, with lens notes', enabled: true },
        { id: 'voiceover', label: 'Voiceover script', description: 'Timed narration only', enabled: false },
        { id: 'social', label: 'Social cutdowns', description: '15s, 30s and 60s variants', enabled: true },
        { id: 'beatsheet', label: 'Beat sheet', description: 'Structural summary for the client', enabled: false },
      ],
    },
  },
  {
    id: 'export-1',
    type: 'export',
    position: { x: 1748, y: 512 },
    data: {
      status: 'draft',
      format: 'md',
      includeNotes: true,
      filename: 'aperture-launch-v1',
      origin: 'core',
    },
  },
]

export const initialEdges: ScriptFloraEdge[] = [
  edge('brief-1', 'skill-1'),
  edge('skill-1', 'hook-1'),
  edge('skill-1', 'scene-1'),
  edge('skill-1', 'dialogue-1', true),
  edge('skill-1', 'visual-1'),
  edge('skill-1', 'cta-1'),
  edge('hook-1', 'continuity-1'),
  edge('scene-1', 'continuity-1'),
  edge('dialogue-1', 'continuity-1'),
  edge('visual-1', 'output-1'),
  edge('cta-1', 'output-1'),
  edge('continuity-1', 'export-1'),
  edge('output-1', 'export-1'),
]
