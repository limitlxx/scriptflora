import type { Edge, Node } from '@xyflow/react'

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

export type NodeStatus =
  | 'empty'
  | 'queued'
  | 'generating'
  | 'draft'
  | 'approved'
  | 'error'

export type SkillId = 'standard' | 'auteur' | 'series' | (string & {})

/** Standard pipeline stages */
export type StandardKind = 'hook' | 'scene' | 'dialogue' | 'visual' | 'cta'

/** Full 5-stage Auteur funnel (Frequency Over Force method) */
export type AuteurKind =
  | 'auteur-stageplay'
  | 'auteur-screenplay'
  | 'auteur-technical'
  | 'auteur-production-summary'
  | 'auteur-script'

export type ContentKind = StandardKind | AuteurKind

export type ToneId =
  | 'cinematic'
  | 'documentary'
  | 'conversational'
  | 'satirical'
  | 'poetic'

export type FormatId =
  | 'screenplay'
  | 'shotlist'
  | 'voiceover'
  | 'social'
  | 'beatsheet'

export type ExportFormatId = 'fdx' | 'pdf' | 'fountain' | 'docx' | 'md'

/* ------------------------------------------------------------------ */
/* Per-node data payloads                                              */
/* ------------------------------------------------------------------ */

export type BriefNodeData = {
  /** Project / video title */
  title: string
  /** One-sentence objective */
  objective: string
  /** Target audience description */
  audience: string
  /** Platforms: YouTube, Instagram, TikTok, etc. */
  platforms: string[]
  /** e.g. "90s", "2 min", "2 hours", "feature (120 min)" */
  duration: string
  tone: ToneId
  /** Hard constraints the model must never violate */
  keyFacts: string[]
  additionalNotes: string
  status: NodeStatus
  locked?: boolean
  /** Generation mode set by the user */
  generationMode?: 'standard' | 'long-form' | 'series' | 'set-by-set'
  /** Target seconds per AI video generation chunk (set-by-set mode) */
  secondsPerSet?: number
}

export type SkillNodeData = {
  selected: SkillId | null
  /** Path to the loaded skill markdown (for custom/imported skills) */
  skillMarkdown?: string
  locked?: boolean
}

export type ContentNodeData = {
  kind: ContentKind
  label: string
  content: string
  prompt?: string
  progress?: number
  status: NodeStatus
  locked?: boolean
  approved?: boolean
  tokens?: number
  /** Ordinal for repeatable stages (scene 1, scene 2…) */
  index?: number
  /** Reconciliation key: skillId + kind + index */
  stageKey?: string
}

export type ContinuityIssueSeverity = 'error' | 'warning' | 'info'

export type ContinuityIssue = {
  id: string
  severity: ContinuityIssueSeverity
  message: string
  source: string
}

export type ContinuityNodeData = {
  status: NodeStatus
  locked?: boolean
  score: number
  checkedAt: string | null
  issues: ContinuityIssue[]
}

export type OutputFormat = {
  id: FormatId
  label: string
  description: string
  enabled: boolean
}

export type OutputNodeData = {
  status: NodeStatus
  locked?: boolean
  formats: OutputFormat[]
}

export type ExportNodeData = {
  status: NodeStatus
  locked?: boolean
  format: ExportFormatId
  includeNotes: boolean
  filename: string
}

/* ------------------------------------------------------------------ */
/* Node union                                                          */
/* ------------------------------------------------------------------ */

export type BriefNode = Node<BriefNodeData, 'brief'>
export type SkillNode = Node<SkillNodeData, 'skill'>
export type ContentNode = Node<ContentNodeData, 'content'>
export type ContinuityNode = Node<ContinuityNodeData, 'continuity'>
export type OutputNode = Node<OutputNodeData, 'output'>
export type EpisodeMemoryNodeData = {
  /**
   * The character/world bible — locked facts that carry across ALL episodes.
   * Injected into every episode's brief generation as hard constraints.
   */
  characterBible: string
  /**
   * Running recap of the previous episode: what changed, what threads are open.
   * Cleared and updated by the user after each episode is finished.
   */
  previousEpisode: string
  /** Episode counter — auto-incremented when user clicks "Next Episode" */
  episodeNumber: number
  status: NodeStatus
  locked?: boolean
}

export type EpisodeMemoryNode = Node<EpisodeMemoryNodeData, 'episode-memory'>

export type ScriptFloraNode =
  | BriefNode
  | SkillNode
  | ContentNode
  | ContinuityNode
  | OutputNode
  | ExportNode
  | EpisodeMemoryNode

export type ScriptFloraNodeType = NonNullable<ScriptFloraNode['type']>
export type ScriptFloraEdge = Edge<{ flowing?: boolean }>

/* ------------------------------------------------------------------ */
/* Generation contract                                                 */
/* ------------------------------------------------------------------ */

export type GenerationRequest = {
  brief: BriefNodeData
  skill: SkillId
  /** Full markdown text of the skill file */
  skillMarkdown: string
  /** Existing content for locked/edited nodes (keyed by stageKey) */
  existingContent: Record<string, string>
  model?: string
  fast?: boolean
  reasoningEffort?: 'low' | 'medium' | 'high'
}

export type GeneratedStage = {
  kind: ContentKind
  index?: number
  stageKey: string
  label: string
  content: string
}

export type GenerationPlan = {
  stages: GeneratedStage[]
  generationId: string
}

/** Returned by /api/generate when duration implies long-form chunking is needed. */
export type ChunkingPlan = {
  needsChunking: true
  totalScenes: number
  durationMinutes: number
  chunks: Array<{ start: number; end: number }>
  generationId: string
}

/* ------------------------------------------------------------------ */
/* Node-level actions                                                  */
/* ------------------------------------------------------------------ */

export type NodeAction =
  | 'regenerate'
  | 'lock'
  | 'unlock'
  | 'approve'
  | 'unapprove'
  | 'duplicate'
  | 'delete'

/* ------------------------------------------------------------------ */
/* Presentation metadata                                               */
/* ------------------------------------------------------------------ */

export const CONTENT_KIND_META: Record<
  ContentKind,
  { label: string; hint: string; group: SkillId | 'both' }
> = {
  hook: { label: 'Hook', hint: 'The first three seconds', group: 'standard' },
  scene: { label: 'Scene', hint: 'Action and setting', group: 'standard' },
  dialogue: { label: 'Dialogue', hint: 'Character voice', group: 'standard' },
  visual: { label: 'Visual Directions', hint: 'Camera, light, motion', group: 'standard' },
  cta: { label: 'Call to Action', hint: 'The close', group: 'standard' },
  'auteur-stageplay': { label: 'Stageplay', hint: 'Dialogue only — Stage I', group: 'auteur' },
  'auteur-screenplay': { label: 'Screenplay', hint: 'Format + atmosphere — Stage II', group: 'auteur' },
  'auteur-technical': { label: 'Technical Screenplay', hint: 'Full blocking — Stage III', group: 'auteur' },
  'auteur-production-summary': { label: 'Production Summary', hint: 'Visual rule sheet — Stage IV', group: 'auteur' },
  'auteur-script': { label: 'Auteur Script', hint: 'Macro-state chunks — Stage V', group: 'auteur' },
}

export const TONE_OPTIONS: { id: ToneId; label: string }[] = [
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'documentary', label: 'Documentary' },
  { id: 'conversational', label: 'Conversational' },
  { id: 'satirical', label: 'Satirical' },
  { id: 'poetic', label: 'Poetic' },
]

export const PLATFORM_OPTIONS = [
  'YouTube',
  'Instagram',
  'TikTok',
  'LinkedIn',
  'Twitter / X',
  'Cinema',
  'Broadcast TV',
  'Training / LMS',
]

export const GENERATION_MODE_OPTIONS: {
  id: NonNullable<BriefNodeData['generationMode']>
  label: string
  hint: string
}[] = [
  { id: 'standard', label: 'Standard', hint: 'Short-form, single-pass generation' },
  { id: 'long-form', label: 'Long-form', hint: 'Feature / multi-act, auto-chunked by AI' },
  { id: 'series', label: 'Series / Season', hint: 'Episode-by-episode arc with continuity memory' },
  { id: 'set-by-set', label: 'Set-by-set', hint: 'Each scene sized to AI video generation window' },
]

export const EXPORT_FORMAT_OPTIONS: {
  id: ExportFormatId
  label: string
  ext: string
}[] = [
  { id: 'fdx', label: 'Final Draft', ext: '.fdx' },
  { id: 'pdf', label: 'PDF', ext: '.pdf' },
  { id: 'fountain', label: 'Fountain', ext: '.fountain' },
  { id: 'docx', label: 'Word', ext: '.docx' },
  { id: 'md', label: 'Markdown', ext: '.md' },
]

export const STATUS_META: Record<
  NodeStatus,
  { label: string; tone: 'neutral' | 'accent' | 'success' | 'danger' }
> = {
  empty: { label: 'Empty', tone: 'neutral' },
  queued: { label: 'Queued', tone: 'neutral' },
  generating: { label: 'Generating', tone: 'accent' },
  draft: { label: 'Draft', tone: 'neutral' },
  approved: { label: 'Approved', tone: 'success' },
  error: { label: 'Needs attention', tone: 'danger' },
}

/* ------------------------------------------------------------------ */
/* Stage key helpers                                                   */
/* ------------------------------------------------------------------ */

/** Deterministic reconciliation key for a generated stage. */
export function stageKey(skillId: SkillId, kind: ContentKind, index?: number): string {
  return index != null ? `${skillId}:${kind}:${index}` : `${skillId}:${kind}`
}
