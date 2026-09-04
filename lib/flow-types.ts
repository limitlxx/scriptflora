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

export type SkillId = 'standard' | 'auteur' | (string & {})

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
/* Phase 8 — Marketplace readiness types                              */
/* ------------------------------------------------------------------ */

/**
 * Tracks which skill version created a node.
 * Required on every node spawned by a skill.
 * ponytail: no-op for end users today; prerequisite for marketplace skill installs.
 */
export type SkillProvenance = {
  skillId: string        // e.g. "scriptflora.auteur"
  skillVersion: string   // e.g. "1.0.3"
  skillNodeKey: string   // template id inside the skill, e.g. "macro_state"
  publisherId?: string   // "scriptflora" for first-party; marketplace publisher id later
}

/**
 * Whether this node is app-owned (core system) or created by a skill.
 * Prevents marketplace skills from claiming to replace Director/continuity nodes.
 */
export type NodeOrigin = 'core' | 'skill'

/**
 * What a node reads/writes and whether it is allowed to touch continuity.
 * Marketplace skills must stay inside their declared contract.
 */
export type NodeSideEffect = 'none' | 'continuity' | 'mediaRequest'

export type NodeContract = {
  reads: Array<'brief' | 'characterBible' | 'styleLock' | 'upstream' | string>
  writes: Array<'scriptText' | 'shots' | 'continuityPatch' | string>
  sideEffects: NodeSideEffect
}

/**
 * Why a skill node is considered stale.
 * Shown as a soft warning — never blocks the user.
 */
export type StaleReason = 'skill_update' | 'upstream_change' | 'brief_change'

/**
 * Data-driven recipe that a skill uses to declare what nodes it creates.
 * Built-in skills use this today so marketplace skills can use the same path later.
 */
export type SkillNodeRecipe = {
  key: string                                 // unique within the skill, e.g. "hook"
  type: string                                // maps to nodeTypes key, e.g. "content"
  kind?: ContentKind                          // for content nodes
  title?: string                              // default label
  dependsOn?: string[]                        // keys this node reads from
  dataDefaults?: Record<string, unknown>      // merged into node.data at creation
}

/**
 * S0 — Permission catalog for skills.
 * A skill must declare every permission it needs before runtime access is granted.
 */
export type SkillPermission =
  | 'read:brief'            // read confirmed brief fields
  | 'read:bible'            // read Character Bible entries
  | 'read:style'            // read Style Lock / Style Packs
  | 'read:assets'           // read project asset library
  | 'write:skill_nodes'     // create / update skill-origin nodes
  | 'write:continuity_patch'// submit continuity patches via the API
  | 'suggest:model_route'   // suggest Runway model preferences
  | 'suggest:packaging'     // suggest HyperFrames template defaults

/**
 * S0 — Required inputs a skill can declare.
 * The canvas checks these before allowing generation to run.
 * Missing required inputs surface a clear preflight error.
 */
export type SkillRequires = {
  /** Minimum app version required */
  app?: string
  /** Brief must be confirmed before running */
  briefConfirmed?: boolean
  /** These canvas node types must exist (at least one of each) */
  nodes?: string[]
  /**
   * These node types must be locked before running.
   * e.g. ['character-bible'] blocks until a locked character with image exists.
   */
  locks?: string[]
  /** Optional inputs (present but not blocking) */
  optionalInputs?: string[]
}

/**
 * S0 — Model preferences a skill can suggest to the router.
 * These are hints only — the user can override.
 */
export type SkillModelPreferences = {
  video?: string[]    // preferred Runway model IDs in priority order
  voice?: string[]    // preferred TTS voice IDs
}

/**
 * S0 — Packaging defaults a skill can suggest to HyperFrames.
 */
export type SkillPackagingDefaults = {
  hyperframesTemplate?: string    // e.g. "explainer_16x9"
  aspectRatios?: string[]
  variables?: Record<string, string>
}

/**
 * A skill manifest — S0 finalized schema.
 * Built-in skills use this; marketplace skills will ship compatible JSON.
 */
export type SkillManifest = {
  skillId: string
  version: string
  publisherId: string
  name: string
  tagline: string
  stages: string                            // human label e.g. "5 stages"
  source: 'builtin' | 'local' | 'marketplace'
  nodes: SkillNodeRecipe[]
  /** S0 additions */
  permissions: SkillPermission[]            // must be declared; checked at runtime
  requires: SkillRequires                   // canvas validates before generation
  modelPreferences?: SkillModelPreferences  // hints to model router
  packagingDefaults?: SkillPackagingDefaults// hints to HyperFrames
  changelog: string                         // required for publish; "Initial release" for builtins
  /** Path to the generation prompt file (loaded server-side) */
  promptFile?: string
  /** Full markdown content (provided directly for imported skills) */
  markdown?: string
}

/* ------------------------------------------------------------------ */
/* Per-node data payloads                                              */
/* ------------------------------------------------------------------ */

export type BriefNodeData = {
  title: string
  objective: string
  audience: string
  platforms: string[]
  duration: string
  tone: ToneId
  keyFacts: string[]
  additionalNotes: string
  status: NodeStatus
  locked?: boolean
  /** Phase 8 */
  origin?: NodeOrigin
  /** Phase 9 — source file provenance for uploaded drafts */
  sourceFile?: string    // original filename
}

export type SkillNodeData = {
  selected: SkillId | null
  skillMarkdown?: string
  locked?: boolean
  /** Phase 8 */
  origin?: NodeOrigin
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
  index?: number
  stageKey?: string
  /** Phase 8 — provenance (set on every skill-created node) */
  origin?: NodeOrigin
  provenance?: SkillProvenance
  contract?: NodeContract
  staleReason?: StaleReason
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
  /** Phase 8 */
  origin?: NodeOrigin
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
  /** Phase 8 */
  origin?: NodeOrigin
}

export type ExportNodeData = {
  status: NodeStatus
  locked?: boolean
  format: ExportFormatId
  includeNotes: boolean
  filename: string
  /** Phase 8 */
  origin?: NodeOrigin
}

/* ------------------------------------------------------------------ */
/* Phase 1 — Continuity core node data                                */
/* ------------------------------------------------------------------ */

export type VoiceProfile = {
  voiceId: string       // e.g. an ElevenLabs voice ID or a name tag
  tone: string          // e.g. "warm, measured"
  style: string         // e.g. "calm narrator"
  sampleNotes: string   // any extra notes
}

/**
 * A single character entry in the Character Bible.
 * One CharacterBibleNode can hold multiple characters.
 */
export type CharacterEntry = {
  id: string
  name: string
  role: string                  // protagonist, antagonist, supporting…
  goals: string
  traits: string
  visualDescription: string
  wardrobe: string              // wardrobe + body language signatures
  referenceImageUrl?: string    // locked image URL (generate or upload)
  voiceProfile: VoiceProfile
  status: 'draft' | 'locked'   // locked = blocks video generation for this character
}

export type CharacterBibleNodeData = {
  status: NodeStatus
  locked?: boolean
  characters: CharacterEntry[]
  origin?: NodeOrigin
}

/**
 * World / Style Lock — visual rules that apply to the whole project.
 */
export type StyleLockNodeData = {
  status: NodeStatus
  locked?: boolean
  medium: 'live-action' | 'animation' | 'hybrid'
  visualRules: string           // color palette, era, mood
  locations: string             // key locations
  hardConstraints: string       // what must NEVER change
  origin?: NodeOrigin
}

/**
 * A single continuity log entry — one per scene/episode.
 */
export type ContinuityLogEntry = {
  id: string
  sceneLabel: string
  characterStates: string       // entry/exit states for characters in this scene
  revealedFacts: string         // facts revealed in this scene
  openThreads: string           // unresolved threads after this scene
  wardrobeChanges: string
}

export type ContinuityLogNodeData = {
  status: NodeStatus
  locked?: boolean
  entries: ContinuityLogEntry[]
  origin?: NodeOrigin
}

/* ------------------------------------------------------------------ */
/* Phase 2 — Shot-layer Director types                                */
/* ------------------------------------------------------------------ */

export type ShotStatus = 'pending' | 'brief_ready' | 'generated' | 'approved' | 'rejected'

/**
 * A single shot / macro-state derived from a script node.
 */
export type Shot = {
  id: string
  index: number
  label: string                   // e.g. "Shot 1 — Darkroom establishing"
  camera: string                  // camera position, movement, lens
  action: string                  // what happens in the frame
  dialogue: string                // spoken lines (empty if no dialogue)
  continuityNotes: string         // what must match incoming/outgoing state
  openingState: string            // world/character state at start of shot
  endingState: string             // world/character state at end of shot
  durationTarget: string          // e.g. "3–5 seconds"
  status: ShotStatus
  storyboardImageUrl?: string     // approved storyboard still for this shot
  sourceNodeId?: string           // which script content node this came from
}

/**
 * Shot / Macro-State expander — holds the ordered shot list for a scene.
 */
export type ShotListNodeData = {
  status: NodeStatus
  locked?: boolean
  sourceSceneLabel: string        // label of the script node this was expanded from
  shots: Shot[]
  origin?: NodeOrigin
}

/**
 * Storyboard node — one key-frame image per shot.
 * Sits alongside the shot list; user approves/rejects each frame.
 */
export type StoryboardNodeData = {
  status: NodeStatus
  locked?: boolean
  shotId: string                  // links to a Shot.id in a ShotListNode
  shotLabel: string
  imageUrl?: string               // generated or uploaded storyboard frame
  notes: string                   // director notes on this frame
  origin?: NodeOrigin
}

/**
 * Sequence skeleton — ordered list of all shots across scenes, no media yet.
 * This becomes the assembly order for Phase 4.
 */
export type SequenceItem = {
  shotId: string
  shotLabel: string
  sourceNodeId: string            // which ShotListNode owns this shot
  status: ShotStatus
}

export type SequenceNodeData = {
  status: NodeStatus
  locked?: boolean
  items: SequenceItem[]
  origin?: NodeOrigin
}

/* ------------------------------------------------------------------ */
/* Phase 3 — Media generation routing types                           */
/* ------------------------------------------------------------------ */

/** Runway model IDs supported by the router. */
export type RunwayModel =
  | 'gen4_turbo'   // draft / fast
  | 'gen4.5'       // balanced / final (default)
  | 'act-two'      // character performance with driving reference
  | 'aleph2'       // video-to-video edit
  | 'veo3.1'       // native audio preferred

export type GenerationPriority = 'draft' | 'balanced' | 'final'

/** Per-shot generation request sent to Runway. */
export type ShotGenerationBrief = {
  shotId: string
  shotLabel: string
  camera: string
  action: string
  dialogue: string
  continuityNotes: string
  durationTarget: string
  characterRefIds: string[]       // Character Bible entry IDs whose images are locked
  styleLockVersion: string        // hash/label of the Style Lock snapshot used
  storyboardImageUrl?: string     // approved storyboard frame passed to Runway as reference
  priority: GenerationPriority
  isEditOfExistingClip: boolean
  needsNativeAudio: boolean
  isPerformanceShot: boolean      // Act-Two route
}

/** Full provenance record stored on every generated result. */
export type GenerationProvenance = {
  modelId: RunwayModel
  provider: 'runway'
  brief: ShotGenerationBrief
  characterRefIds: string[]
  styleLockVersion: string
  continuitySnapshot: string      // JSON string of relevant continuity state at generation time
  estimatedCost: number           // credits or USD estimate
  generatedAt: string             // ISO timestamp
}

/**
 * Generate Shot node — triggers Runway API for one shot.
 */
export type GenerateShotNodeData = {
  status: NodeStatus
  locked?: boolean
  brief?: ShotGenerationBrief
  selectedModel?: RunwayModel
  priority: GenerationPriority
  isEditOfExistingClip: boolean
  needsNativeAudio: boolean
  isPerformanceShot: boolean
  estimatedCost?: number
  origin?: NodeOrigin
}

/**
 * Result node — stores a generated clip + audio + full provenance.
 */
export type ResultStatus = 'generated' | 'in_review' | 'approved' | 'rejected'

export type ResultNodeData = {
  status: NodeStatus
  locked?: boolean
  resultStatus: ResultStatus
  videoUrl?: string               // local blob URL or remote URL
  audioUrl?: string               // voice/dialogue audio
  thumbnailUrl?: string           // first-frame thumbnail
  provenance?: GenerationProvenance
  rejectionReason?: string
  origin?: NodeOrigin
}

/**
 * Checkpoint gate — human must approve before next batch runs.
 */
export type CheckpointNodeData = {
  status: NodeStatus
  locked?: boolean
  label: string                   // e.g. "Scene 1 complete"
  requiredApprovals: number       // how many result nodes must be approved
  currentApprovals: number        // how many are approved right now
  gateOpen: boolean               // true = next batch can run
  notes: string                   // director notes / instructions for next batch
  origin?: NodeOrigin
}

/* ------------------------------------------------------------------ */
/* Phase 4 — Assembly and export types                                */
/* ------------------------------------------------------------------ */

/**
 * One clip in the timeline, referencing an approved Result node.
 */
export type TimelineClip = {
  id: string
  resultNodeId: string            // which Result node this clip comes from
  label: string                   // shot label for display
  videoUrl?: string               // from Result.videoUrl
  audioUrl?: string               // from Result.audioUrl
  thumbnailUrl?: string           // first-frame thumbnail
  durationSeconds: number         // user-editable duration (seconds)
  trimStart: number               // trim from start (seconds)
  trimEnd: number                 // trim from end (seconds)
  transition: 'cut' | 'fade'      // cut point style
  order: number                   // display order (0-indexed)
}

/**
 * Timeline / rough-cut node.
 * Holds ordered clips pulled from approved Result nodes.
 */
export type TimelineNodeData = {
  status: NodeStatus
  locked?: boolean
  clips: TimelineClip[]
  totalDuration: number           // sum of clip durations (seconds)
  playing: boolean                // preview play state
  origin?: NodeOrigin
}

/**
 * Export package node.
 * Builds the handoff zip: numbered clips, audio, script, Bible, Continuity Log, NLE markers.
 */
export type NLETarget = 'capcut' | 'premiere' | 'davinci' | 'descript' | 'generic'

export type ExportPackageNodeData = {
  status: NodeStatus
  locked?: boolean
  filename: string
  nleTarget: NLETarget
  includeScript: boolean
  includeCharacterBible: boolean
  includeContinuityLog: boolean
  includeNleMarkers: boolean
  lastExportedAt?: string
  origin?: NodeOrigin
}

/* ------------------------------------------------------------------ */
/* Phase 5 — Autopilot with checkpoints                               */
/* ------------------------------------------------------------------ */

export type BatchItem = {
  id: string
  index: number
  label: string               // e.g. "Shot 4 — Rooftop close-up"
  rationale: string           // why the Director proposes this shot next
  approved: boolean           // user has approved this item for the batch
  rejected: boolean
}

/**
 * Batch Planner node.
 * ChatGPT proposes the next N shots/scenes; the user approves the plan
 * before any generation runs.
 */
export type BatchPlannerNodeData = {
  status: NodeStatus
  locked?: boolean
  batchSize: number             // how many shots to propose per batch
  items: BatchItem[]
  planApproved: boolean         // true = user approved entire plan → generation can start
  directorRationale: string     // overall Director reasoning for this batch
  origin?: NodeOrigin
}

export type AutopilotStatus = 'idle' | 'running' | 'paused' | 'checkpoint' | 'complete'
export type CheckpointFrequency = 'every-shot' | 'every-scene' | 'every-5-shots' | 'every-10-shots'

/**
 * Autopilot Dashboard node.
 * Configures and drives the batch generation loop.
 * Surfaces progress, cost, open continuity issues, and pauses at human gates.
 */
export type AutopilotDashboardNodeData = {
  status: NodeStatus
  locked?: boolean
  autopilotStatus: AutopilotStatus
  checkpointFrequency: CheckpointFrequency
  // Progress counters
  totalShots: number
  completedShots: number
  approvedShots: number
  rejectedShots: number
  // Cost accumulation
  totalCostEstimate: number     // credits so far
  costPerBatch: number          // estimated credits for next batch
  // Continuity issues found at checkpoints
  openIssues: number
  // Current batch info
  currentBatchLabel: string     // e.g. "Scene 2, shots 6–10"
  lastCheckpointAt?: string     // ISO timestamp
  origin?: NodeOrigin
}

/* ------------------------------------------------------------------ */
/* Node union                                                          */
/* ------------------------------------------------------------------ */

export type BriefNode = Node<BriefNodeData, 'brief'>
export type SkillNode = Node<SkillNodeData, 'skill'>
export type ContentNode = Node<ContentNodeData, 'content'>
export type ContinuityNode = Node<ContinuityNodeData, 'continuity'>
export type OutputNode = Node<OutputNodeData, 'output'>
export type ExportNode = Node<ExportNodeData, 'export'>
export type CharacterBibleNode = Node<CharacterBibleNodeData, 'character-bible'>
export type StyleLockNode = Node<StyleLockNodeData, 'style-lock'>
export type ContinuityLogNode = Node<ContinuityLogNodeData, 'continuity-log'>
export type ShotListNode = Node<ShotListNodeData, 'shot-list'>
export type StoryboardNode = Node<StoryboardNodeData, 'storyboard'>
export type SequenceNode = Node<SequenceNodeData, 'sequence'>
export type GenerateShotNode = Node<GenerateShotNodeData, 'generate-shot'>
export type ResultNode = Node<ResultNodeData, 'result'>
export type CheckpointNode = Node<CheckpointNodeData, 'checkpoint'>
export type TimelineNode = Node<TimelineNodeData, 'timeline'>
export type ExportPackageNode = Node<ExportPackageNodeData, 'export-package'>
export type BatchPlannerNode = Node<BatchPlannerNodeData, 'batch-planner'>
export type AutopilotDashboardNode = Node<AutopilotDashboardNodeData, 'autopilot-dashboard'>

/* ------------------------------------------------------------------ */
/* Phase 6 — Multi-episode / long-form memory types                   */
/* ------------------------------------------------------------------ */

/**
 * Snapshot of character state at the end of an episode.
 * Becomes the entry state for the next episode.
 */
export type CharacterStateSnapshot = {
  characterId: string
  characterName: string
  exitState: string         // what happened to this character by episode end
  entryState: string        // how they should appear at the start of next episode
  wardrobeAtEnd: string     // wardrobe when they left the scene
}

/**
 * Episode Memory node — exit state → next episode entry state.
 * One node per episode boundary.
 */
export type EpisodeMemoryNodeData = {
  status: NodeStatus
  locked?: boolean
  episodeNumber: number
  episodeTitle: string
  characterSnapshots: CharacterStateSnapshot[]
  revealedFacts: string        // facts revealed this episode (carries forward)
  openThreads: string          // unresolved threads to carry into next episode
  resolvedThreads: string      // threads that were closed this episode
  nextEpisodeNotes: string     // Director notes for the next episode
  linkedToEpisode?: number     // episode number this exits into
  origin?: NodeOrigin
}

/**
 * A single arc beat in the season tracker.
 */
export type ArcBeat = {
  id: string
  label: string                // e.g. "Act 1 — Inciting Incident"
  episodeRange: string         // e.g. "Ep 1–3"
  description: string
  status: 'planned' | 'written' | 'generated' | 'complete'
  characterMilestones: string  // what changes for key characters in this beat
  openThreads: string
  resolvedThreads: string
}

/**
 * Series Arc node — season/film arc tracker.
 * Tracks open threads, payoffs, character arc milestones across all episodes.
 */
export type SeriesArcNodeData = {
  status: NodeStatus
  locked?: boolean
  seriesTitle: string
  totalEpisodes: number
  currentEpisode: number
  beats: ArcBeat[]
  overarchingThemes: string
  characterArcs: string        // brief summary of each main character's overall arc
  origin?: NodeOrigin
}

export type EpisodeMemoryNode = Node<EpisodeMemoryNodeData, 'episode-memory'>
export type SeriesArcNode = Node<SeriesArcNodeData, 'series-arc'>

/* ------------------------------------------------------------------ */
/* Phase 7 — Packs, social, team                                      */
/* ------------------------------------------------------------------ */

export type PackId = 'ads' | 'series' | 'animation' | 'education' | 'hybrid'

export type PackConfig = {
  packId: PackId
  name: string
  defaults: {
    medium: string
    checkpointFrequency: CheckpointFrequency
    identityLockRequired: boolean    // character images required before generation
    shortShotsOnly: boolean          // max 5s shots
    seriesContinuity: boolean        // enable episode memory
  }
}

export const PACK_CONFIGS: Record<PackId, PackConfig> = {
  ads: {
    packId: 'ads',
    name: 'Ads / Commercials',
    defaults: { medium: 'live-action', checkpointFrequency: 'every-shot', identityLockRequired: true, shortShotsOnly: true, seriesContinuity: false },
  },
  series: {
    packId: 'series',
    name: 'Series / Episodic Drama',
    defaults: { medium: 'live-action', checkpointFrequency: 'every-scene', identityLockRequired: true, shortShotsOnly: false, seriesContinuity: true },
  },
  animation: {
    packId: 'animation',
    name: 'Animation / Cartoon',
    defaults: { medium: 'animation', checkpointFrequency: 'every-5-shots', identityLockRequired: true, shortShotsOnly: false, seriesContinuity: false },
  },
  education: {
    packId: 'education',
    name: 'Educational / Training',
    defaults: { medium: 'live-action', checkpointFrequency: 'every-scene', identityLockRequired: false, shortShotsOnly: false, seriesContinuity: false },
  },
  hybrid: {
    packId: 'hybrid',
    name: 'Hybrid',
    defaults: { medium: 'hybrid', checkpointFrequency: 'every-5-shots', identityLockRequired: true, shortShotsOnly: false, seriesContinuity: false },
  },
}

export type ProjectPackNodeData = {
  status: NodeStatus
  locked?: boolean
  selectedPack: PackId | null
  appliedAt?: string            // ISO timestamp when pack was applied
  origin?: NodeOrigin
}

export type SocialPlatform = 'youtube' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter'

export type SocialVariant = {
  id: string
  platform: SocialPlatform
  label: string                 // e.g. "Instagram Reel – 30s"
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5'
  maxDurationSeconds: number
  captionsRequired: boolean
  thumbnailRequired: boolean
  status: 'pending' | 'ready' | 'exported'
}

export type SocialVariantsNodeData = {
  status: NodeStatus
  locked?: boolean
  variants: SocialVariant[]
  publishSchedule: string       // free-form schedule notes
  thumbnailPrompt: string       // prompt for thumbnail/key art generation
  thumbnailUrl?: string         // generated or uploaded thumbnail
  origin?: NodeOrigin
}

export type TeamComment = {
  id: string
  author: string
  text: string
  nodeRef?: string              // which canvas node this references
  resolved: boolean
  createdAt: string
}

export type TeamWorkspaceNodeData = {
  status: NodeStatus
  locked?: boolean
  workspaceName: string
  brandKitNotes: string         // brand colours, fonts, tone guidelines
  approvalRequired: boolean     // all exports need team approval
  comments: TeamComment[]
  origin?: NodeOrigin
}

export type ProjectPackNode = Node<ProjectPackNodeData, 'project-pack'>
export type SocialVariantsNode = Node<SocialVariantsNodeData, 'social-variants'>
export type TeamWorkspaceNode = Node<TeamWorkspaceNodeData, 'team-workspace'>

/* ------------------------------------------------------------------ */
/* Phase 11 — HyperFrames composition node                            */
/* ------------------------------------------------------------------ */

export type HyperFramesTemplate = 'explainer_16x9' | 'ad_endcard_16x9' | 'social_9x16' | 'training_module'

export type HyperFramesStatus =
  | 'idle'
  | 'mapping'
  | 'building_composition'
  | 'rendering'
  | 'ready_for_review'
  | 'approved'
  | 'failed'

export type HyperFramesClipMapping = {
  slotIndex: number
  clipLabel: string
  resultNodeId: string    // links to a Result node
  videoUrl?: string
  audioUrl?: string
  durationSeconds: number
}

export type HyperFramesOutputAsset = {
  ratio: string           // e.g. "16:9", "9:16"
  url: string
  format: string          // "mp4"
}

export type HyperFramesProvenance = {
  provider: 'hyperframes'
  renderMode: 'heygen_cloud' | 'simulated'
  templateId: HyperFramesTemplate
  templateVersion: string
  variables: Record<string, string>
  sourceClipIds: string[]
  aspectRatios: string[]
  renderIds: string[]
  outputAssets: HyperFramesOutputAsset[]
  createdAt: string
}

export type HyperFramesNodeData = {
  status: NodeStatus
  locked?: boolean
  hfStatus: HyperFramesStatus
  templateId: HyperFramesTemplate
  aspectRatios: string[]          // e.g. ["16:9", "9:16"]
  variables: Record<string, string>  // title, CTA, logoUrl, primaryColor, etc.
  clipMappings: HyperFramesClipMapping[]
  renderTaskId?: string
  provenance?: HyperFramesProvenance
  errorMessage?: string
  origin?: NodeOrigin
}

export type HyperFramesNode = Node<HyperFramesNodeData, 'hyperframes'>

export type ScriptFloraNode =
  | BriefNode
  | SkillNode
  | ContentNode
  | ContinuityNode
  | OutputNode
  | ExportNode
  | CharacterBibleNode
  | StyleLockNode
  | ContinuityLogNode
  | ShotListNode
  | StoryboardNode
  | SequenceNode
  | GenerateShotNode
  | ResultNode
  | CheckpointNode
  | TimelineNode
  | ExportPackageNode
  | BatchPlannerNode
  | AutopilotDashboardNode
  | EpisodeMemoryNode
  | SeriesArcNode
  | ProjectPackNode
  | SocialVariantsNode
  | TeamWorkspaceNode
  | HyperFramesNode

export type ScriptFloraNodeType = NonNullable<ScriptFloraNode['type']>
export type ScriptFloraEdge = Edge<{ flowing?: boolean }>

/* ------------------------------------------------------------------ */
/* Generation contract                                                 */
/* ------------------------------------------------------------------ */

export type GenerationRequest = {
  brief: BriefNodeData
  skill: SkillId
  skillMarkdown: string
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
/* Phase 8 — Continuity patch API contract                            */
/* ------------------------------------------------------------------ */

/**
 * All continuity mutations must go through this shape.
 * Ensures marketplace skills can't free-form mutate continuity state.
 */
export type ContinuityPatch = {
  characterStates?: Record<string, string>
  revealedFacts?: string[]
  openThreads?: string[]
  sourceNodeId: string
  skillId: string
  skillVersion: string
}

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

export function stageKey(skillId: SkillId, kind: ContentKind, index?: number): string {
  return index != null ? `${skillId}:${kind}:${index}` : `${skillId}:${kind}`
}

/* ------------------------------------------------------------------ */
/* Phase 8 — Built-in skill manifests                                 */
/* ------------------------------------------------------------------ */

/**
 * Node contracts per content kind.
 * ponytail: defined once here, referenced wherever nodes are created.
 */
export const CONTENT_NODE_CONTRACTS: Record<ContentKind, NodeContract> = {
  hook:     { reads: ['brief', 'upstream'], writes: ['scriptText'], sideEffects: 'none' },
  scene:    { reads: ['brief', 'upstream'], writes: ['scriptText'], sideEffects: 'none' },
  dialogue: { reads: ['brief', 'upstream'], writes: ['scriptText'], sideEffects: 'none' },
  visual:   { reads: ['brief', 'upstream'], writes: ['scriptText'], sideEffects: 'none' },
  cta:      { reads: ['brief', 'upstream'], writes: ['scriptText'], sideEffects: 'none' },
  'auteur-stageplay':          { reads: ['brief'], writes: ['scriptText'], sideEffects: 'none' },
  'auteur-screenplay':         { reads: ['brief', 'upstream'], writes: ['scriptText'], sideEffects: 'none' },
  'auteur-technical':          { reads: ['brief', 'upstream'], writes: ['scriptText'], sideEffects: 'none' },
  'auteur-production-summary': { reads: ['brief', 'upstream'], writes: ['scriptText'], sideEffects: 'none' },
  'auteur-script':             { reads: ['brief', 'upstream'], writes: ['scriptText'], sideEffects: 'none' },
}

export const SKILL_MANIFESTS: Record<string, SkillManifest> = {
  standard: {
    skillId: 'scriptflora.standard',
    version: '1.0.0',
    publisherId: 'scriptflora',
    name: 'Standard Script',
    tagline: 'Hook, scenes, dialogue, visual direction, close. Reliable structure for brand and social work.',
    stages: '5 stages',
    source: 'builtin',
    promptFile: 'standard-script.md',
    changelog: 'Initial release — S0 manifest finalized.',
    permissions: ['read:brief', 'write:skill_nodes'],
    requires: { briefConfirmed: true },
    nodes: [
      { key: 'hook',     type: 'content', kind: 'hook',     title: 'Hook' },
      { key: 'scene',    type: 'content', kind: 'scene',    title: 'Scene',    dependsOn: ['hook'] },
      { key: 'dialogue', type: 'content', kind: 'dialogue', title: 'Dialogue', dependsOn: ['scene'] },
      { key: 'visual',   type: 'content', kind: 'visual',   title: 'Visual Directions', dependsOn: ['scene'] },
      { key: 'cta',      type: 'content', kind: 'cta',      title: 'Call to Action', dependsOn: ['hook', 'scene'] },
    ],
  },
  auteur: {
    skillId: 'scriptflora.auteur',
    version: '1.0.0',
    publisherId: 'scriptflora',
    name: 'Storyline Auteur Script',
    tagline: 'Stageplay → Screenplay → Technical Screenplay → Production Summary → Auteur Script. Built for generative video continuity.',
    stages: '5 stages',
    source: 'builtin',
    promptFile: 'auteur-script.md',
    changelog: 'Initial release — S0 manifest finalized.',
    permissions: ['read:brief', 'read:bible', 'read:style', 'write:skill_nodes'],
    requires: {
      briefConfirmed: true,
      locks: ['character-bible'],
    },
    modelPreferences: {
      video: ['gen4.5', 'gen4_turbo'],
    },
    nodes: [
      { key: 'auteur-stageplay',          type: 'content', kind: 'auteur-stageplay',          title: 'Stageplay' },
      { key: 'auteur-screenplay',         type: 'content', kind: 'auteur-screenplay',         title: 'Screenplay',          dependsOn: ['auteur-stageplay'] },
      { key: 'auteur-technical',          type: 'content', kind: 'auteur-technical',          title: 'Technical Screenplay', dependsOn: ['auteur-screenplay'] },
      { key: 'auteur-production-summary', type: 'content', kind: 'auteur-production-summary', title: 'Production Summary',   dependsOn: ['auteur-technical'] },
      { key: 'auteur-script',             type: 'content', kind: 'auteur-script',             title: 'Auteur Script',        dependsOn: ['auteur-production-summary'] },
    ],
  },
  series: {
    skillId: 'scriptflora.series',
    version: '1.0.0',
    publisherId: 'scriptflora',
    name: 'Series Script Structure',
    tagline: 'Season arcs, episode maps, multi-episode continuity planning. For episodic drama and long-form series.',
    stages: '5 stages',
    source: 'builtin',
    promptFile: 'series-script.md',
    changelog: 'Initial release — S0 manifest finalized.',
    permissions: ['read:brief', 'read:bible', 'read:style', 'write:skill_nodes', 'write:continuity_patch'],
    requires: {
      briefConfirmed: true,
      locks: ['character-bible'],
      nodes: ['episode-memory'],
    },
    modelPreferences: {
      video: ['gen4.5', 'act-two'],
    },
    packagingDefaults: {
      hyperframesTemplate: 'explainer_16x9',
      aspectRatios: ['16:9'],
    },
    nodes: [
      { key: 'series-hook',     type: 'content', kind: 'hook',     title: 'Series Hook' },
      { key: 'episode-outline', type: 'content', kind: 'scene',    title: 'Episode Outline', dependsOn: ['series-hook'] },
      { key: 'act-beat',        type: 'content', kind: 'dialogue', title: 'Act Beat',         dependsOn: ['episode-outline'] },
      { key: 'series-visual',   type: 'content', kind: 'visual',   title: 'Series Visual Notes', dependsOn: ['episode-outline'] },
      { key: 'series-cta',      type: 'content', kind: 'cta',      title: 'Episode Close',    dependsOn: ['act-beat'] },
    ],
  },
}

/** Core node origins — these are never created by skills. */
export const CORE_NODE_TYPES: Set<string> = new Set([
  'brief', 'continuity', 'output', 'export',
  'character-bible', 'style-lock', 'continuity-log',
  'shot-list', 'storyboard', 'sequence',
  'generate-shot', 'result', 'checkpoint',
  'timeline', 'export-package',
  'batch-planner', 'autopilot-dashboard',
  'episode-memory', 'series-arc',
  'project-pack', 'social-variants', 'team-workspace',
  'hyperframes',
])
