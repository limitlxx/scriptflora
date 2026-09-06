'use client'

import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type NodeTypes,
  type OnConnect,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CONTENT_KIND_META,
  CONTENT_NODE_CONTRACTS,
  SKILL_MANIFESTS,
  type BriefNodeData,
  type ContentKind,
  type ContentNodeData,
  type GenerationPlan,
  type GenerationRequest,
  type NodeAction,
  type ScriptFloraEdge,
  type ScriptFloraNode,
  type SkillId,
} from '@/lib/flow-types'
import { loadProjectGraph, saveProjectGraph, updateProject } from '@/lib/store'
import { NodeActionProvider } from './node-action-context'
import { BriefNode } from '@/components/nodes/brief-node'
import { SkillNode } from '@/components/nodes/skill-node'
import { ContentNode } from '@/components/nodes/content-node'
import { ContinuityNode } from '@/components/nodes/continuity-node'
import { OutputNode } from '@/components/nodes/output-node'
import { ExportNode } from '@/components/nodes/export-node'
import { CharacterBibleNode } from '@/components/nodes/character-bible-node'
import { StyleLockNode } from '@/components/nodes/style-lock-node'
import { ContinuityLogNode } from '@/components/nodes/continuity-log-node'
import { ShotListNode } from '@/components/nodes/shot-list-node'
import { StoryboardNode } from '@/components/nodes/storyboard-node'
import { SequenceNode } from '@/components/nodes/sequence-node'
import { GenerateShotNode } from '@/components/nodes/generate-shot-node'
import { ResultNode } from '@/components/nodes/result-node'
import { CheckpointNode } from '@/components/nodes/checkpoint-node'
import { TimelineNode } from '@/components/nodes/timeline-node'
import { ExportPackageNode } from '@/components/nodes/export-package-node'
import { BatchPlannerNode } from '@/components/nodes/batch-planner-node'
import { AutopilotDashboardNode } from '@/components/nodes/autopilot-dashboard-node'
import { EpisodeMemoryNode } from '@/components/nodes/episode-memory-node'
import { SeriesArcNode } from '@/components/nodes/series-arc-node'
import { ProjectPackNode } from '@/components/nodes/project-pack-node'
import { SocialVariantsNode } from '@/components/nodes/social-variants-node'
import { TeamWorkspaceNode } from '@/components/nodes/team-workspace-node'
import { HyperFramesNode } from '@/components/nodes/hyperframes-node'
// Feature P1 — Panel system
import { NodesLibraryPanel } from '@/components/panels/nodes-library-panel'
import { InspectorPanel } from '@/components/panels/inspector-panel'
import { CoachPanel } from '@/components/panels/coach-panel'
import { PanelToggleButton } from '@/components/panels/panel-toggle-button'
import { panelActions } from '@/lib/panel-store'
import { deriveCoachState } from '@/lib/coach-state'
import { useAuth } from '@/components/auth-context'
import { Bot, Info, Layers, LocateFixed } from 'lucide-react'
import { TopBar, type GenerateState, type GenerationSettings } from './top-bar'
import { CanvasControls, type CanvasMode } from './canvas-controls'
import { AddNodeMenu, type AddNodeRequest } from './add-node-menu'
import { EmptyState } from './empty-state'
import { FloatingSidebar } from './floating-sidebar'
import { ToastStack } from './toast-stack'
import { toast } from '@/lib/toast'
import { nanoid } from 'nanoid'

const nodeTypes: NodeTypes = {
  brief: BriefNode,
  skill: SkillNode,
  content: ContentNode,
  continuity: ContinuityNode,
  output: OutputNode,
  export: ExportNode,
  'character-bible': CharacterBibleNode,
  'style-lock': StyleLockNode,
  'continuity-log': ContinuityLogNode,
  'shot-list': ShotListNode,
  'storyboard': StoryboardNode,
  'sequence': SequenceNode,
  'generate-shot': GenerateShotNode,
  'result': ResultNode,
  'checkpoint': CheckpointNode,
  'timeline': TimelineNode,
  'export-package': ExportPackageNode,
  'batch-planner': BatchPlannerNode,
  'autopilot-dashboard': AutopilotDashboardNode,
  'episode-memory': EpisodeMemoryNode,
  'series-arc': SeriesArcNode,
  'project-pack': ProjectPackNode,
  'social-variants': SocialVariantsNode,
  'team-workspace': TeamWorkspaceNode,
  'hyperframes': HyperFramesNode,
}

const MINIMAP_COLOR: Record<string, string> = {
  brief: 'oklch(0.42 0.02 285)',
  skill: 'oklch(0.42 0.02 285)',
  content: 'oklch(0.38 0.015 285)',
  continuity: 'oklch(0.5 0.09 296)',
  output: 'oklch(0.5 0.09 296)',
  export: 'oklch(0.6 0.13 296)',
  'character-bible': 'oklch(0.48 0.11 30)',
  'style-lock': 'oklch(0.48 0.09 200)',
  'continuity-log': 'oklch(0.45 0.09 260)',
  'shot-list': 'oklch(0.44 0.10 50)',
  'storyboard': 'oklch(0.44 0.08 60)',
  'sequence': 'oklch(0.42 0.08 280)',
  'generate-shot': 'oklch(0.46 0.13 296)',
  'result': 'oklch(0.44 0.10 296)',
  'checkpoint': 'oklch(0.50 0.12 140)',
  'timeline': 'oklch(0.44 0.09 30)',
  'export-package': 'oklch(0.46 0.11 60)',
  'batch-planner': 'oklch(0.46 0.12 296)',
  'autopilot-dashboard': 'oklch(0.44 0.10 140)',
  'episode-memory': 'oklch(0.44 0.10 220)',
  'series-arc': 'oklch(0.46 0.12 250)',
  'project-pack': 'oklch(0.44 0.10 30)',
  'social-variants': 'oklch(0.46 0.12 180)',
  'team-workspace': 'oklch(0.46 0.10 240)',
  'hyperframes': 'oklch(0.48 0.14 296)',
}

let idCounter = 100
const nextId = (prefix: string) => `${prefix}-${++idCounter}`

/** Seed the counter above any existing node ids to prevent collisions after reload. */
function seedIdCounter(nodes: ScriptFloraNode[]) {
  for (const n of nodes) {
    const num = parseInt(n.id.split('-').pop() ?? '0', 10)
    if (!isNaN(num) && num > idCounter) idCounter = num
  }
}

// ── Canvas right-click context menu ──────────────────────────────────────────

function CanvasContextMenu({
  x, y,
  onAddNode,
  onClose,
}: {
  x: number
  y: number
  onAddNode: () => void
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const down = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose() }
    const key  = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [onClose])

  const left = Math.min(x, window.innerWidth  - 200)
  const top  = Math.min(y, window.innerHeight - 200)

  const menuItem = (label: string, icon: React.ReactNode, action: () => void) => (
    <button
      key={label}
      type="button"
      role="menuitem"
      onClick={() => { action(); onClose() }}
      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12px] text-foreground/80 transition-colors hover:bg-white/[0.07] hover:text-foreground"
    >
      {icon}
      {label}
    </button>
  )

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Canvas options"
      style={{ position: 'fixed', left, top, zIndex: 9999, width: 192 }}
      className="animate-in fade-in-0 zoom-in-95 flex flex-col overflow-hidden rounded-xl border border-white/[0.12] bg-[oklch(0.16_0.005_285/0.97)] py-1 shadow-[0_20px_60px_-12px_oklch(0_0_0/0.8)] backdrop-blur-2xl duration-100"
    >
      {menuItem('Add node here', <Layers className="size-3.5 shrink-0 opacity-60" />, onAddNode)}
      <div className="my-1 h-px bg-white/[0.07]" role="separator" />
      {menuItem('Stack all panels', <Layers className="size-3.5 shrink-0 opacity-60" />, () => panelActions.stackAll())}
      {menuItem('Reset all panels', <LocateFixed className="size-3.5 shrink-0 opacity-60" />, () => {
        for (const id of ['nodes-library', 'inspector', 'coach', 'assets']) panelActions.resetToDefault(id)
        window.dispatchEvent(new CustomEvent('sf:panels:change'))
      })}
    </div>
  )
}


function buildNode(request: AddNodeRequest, position: { x: number; y: number }): ScriptFloraNode {
  const { type, kind } = request
  switch (type) {
    case 'brief':
      return {
        id: nextId('brief'), type: 'brief', position,
        data: { title: '', objective: '', audience: '', platforms: [], duration: '', tone: 'cinematic', keyFacts: [], additionalNotes: '', status: 'empty', origin: 'core' },
      }
    case 'skill':
      return { id: nextId('skill'), type: 'skill', position, data: { selected: request.skillId ?? null, skillMarkdown: request.skillMarkdown ?? '', origin: 'core' } }
    case 'continuity':
      return { id: nextId('continuity'), type: 'continuity', position, data: { status: 'empty', score: 0, checkedAt: null, issues: [], origin: 'core' } }
    case 'output':
      return {
        id: nextId('output'), type: 'output', position,
        data: {
          status: 'empty',
          origin: 'core' as const,
          formats: [
            { id: 'screenplay', label: 'Screenplay', description: 'Industry-standard scene formatting', enabled: true },
            { id: 'shotlist', label: 'Shot list', description: 'One row per shot, with lens notes', enabled: false },
            { id: 'voiceover', label: 'Voiceover script', description: 'Timed narration only', enabled: false },
            { id: 'social', label: 'Social cutdowns', description: '15s, 30s and 60s variants', enabled: false },
            { id: 'beatsheet', label: 'Beat sheet', description: 'Structural summary for the client', enabled: false },
          ],
        },
      }
    case 'export':
      return { id: nextId('export'), type: 'export', position, data: { status: 'empty', format: 'md', includeNotes: false, filename: 'untitled-script', origin: 'core' } }
    case 'character-bible':
      return { id: nextId('character-bible'), type: 'character-bible', position, data: { status: 'empty', characters: [], origin: 'core' } }
    case 'style-lock':
      return {
        id: nextId('style-lock'), type: 'style-lock', position,
        data: { status: 'empty', medium: 'live-action', visualRules: '', locations: '', hardConstraints: '', origin: 'core' },
      }
    case 'continuity-log':
      return { id: nextId('continuity-log'), type: 'continuity-log', position, data: { status: 'empty', entries: [], origin: 'core' } }
    case 'shot-list':
      return { id: nextId('shot-list'), type: 'shot-list', position, data: { status: 'empty', sourceSceneLabel: '', shots: [], origin: 'core' } }
    case 'storyboard':
      return { id: nextId('storyboard'), type: 'storyboard', position, data: { status: 'empty', shotId: '', shotLabel: '', imageUrl: undefined, notes: '', origin: 'core' } }
    case 'sequence':
      return { id: nextId('sequence'), type: 'sequence', position, data: { status: 'empty', items: [], origin: 'core' } }
    case 'generate-shot':
      return {
        id: nextId('generate-shot'), type: 'generate-shot', position,
        data: { status: 'empty', priority: 'balanced', isEditOfExistingClip: false, needsNativeAudio: false, isPerformanceShot: false, origin: 'core' },
      }
    case 'result':
      return { id: nextId('result'), type: 'result', position, data: { status: 'empty', resultStatus: 'generated', origin: 'core' } }
    case 'checkpoint':
      return {
        id: nextId('checkpoint'), type: 'checkpoint', position,
        data: { status: 'empty', label: '', requiredApprovals: 1, currentApprovals: 0, gateOpen: false, notes: '', origin: 'core' },
      }
    case 'timeline':
      return { id: nextId('timeline'), type: 'timeline', position, data: { status: 'empty', clips: [], totalDuration: 0, playing: false, origin: 'core' } }
    case 'export-package':
      return {
        id: nextId('export-package'), type: 'export-package', position,
        data: {
          status: 'empty', filename: '', nleTarget: 'generic',
          includeScript: true, includeCharacterBible: true,
          includeContinuityLog: true, includeNleMarkers: true,
          origin: 'core',
        },
      }
    case 'batch-planner':
      return {
        id: nextId('batch-planner'), type: 'batch-planner', position,
        data: { status: 'empty', batchSize: 5, items: [], planApproved: false, directorRationale: '', origin: 'core' },
      }
    case 'autopilot-dashboard':
      return {
        id: nextId('autopilot-dashboard'), type: 'autopilot-dashboard', position,
        data: {
          status: 'empty', autopilotStatus: 'idle', checkpointFrequency: 'every-5-shots',
          totalShots: 0, completedShots: 0, approvedShots: 0, rejectedShots: 0,
          totalCostEstimate: 0, costPerBatch: 0, openIssues: 0, currentBatchLabel: '',
          origin: 'core',
        },
      }
    case 'episode-memory':
      return {
        id: nextId('episode-memory'), type: 'episode-memory', position,
        data: {
          status: 'empty', episodeNumber: 1, episodeTitle: '',
          characterSnapshots: [], revealedFacts: '', openThreads: '',
          resolvedThreads: '', nextEpisodeNotes: '', origin: 'core',
        },
      }
    case 'series-arc':
      return {
        id: nextId('series-arc'), type: 'series-arc', position,
        data: {
          status: 'empty', seriesTitle: '', totalEpisodes: 1, currentEpisode: 1,
          beats: [], overarchingThemes: '', characterArcs: '', origin: 'core',
        },
      }
    case 'project-pack':
      return { id: nextId('project-pack'), type: 'project-pack', position, data: { status: 'empty', selectedPack: null, origin: 'core' } }
    case 'social-variants':
      return {
        id: nextId('social-variants'), type: 'social-variants', position,
        data: { status: 'empty', variants: [], publishSchedule: '', thumbnailPrompt: '', origin: 'core' },
      }
    case 'team-workspace':
      return {
        id: nextId('team-workspace'), type: 'team-workspace', position,
        data: { status: 'empty', workspaceName: '', brandKitNotes: '', approvalRequired: false, comments: [], origin: 'core' },
      }
    case 'hyperframes':
      return {
        id: nextId('hyperframes'), type: 'hyperframes', position,
        data: {
          status: 'empty', hfStatus: 'idle', templateId: 'explainer_16x9',
          aspectRatios: ['16:9'], variables: {}, clipMappings: [], origin: 'core',
        },
      }
    case 'content':
    default: {
      const contentKind: ContentKind = kind ?? 'scene'
      // User-manually-added content nodes have no skill provenance
      return {
        id: nextId('content'), type: 'content', position,
        data: { kind: contentKind, label: CONTENT_KIND_META[contentKind].label, content: '', prompt: '', progress: 0, status: 'empty', tokens: 0, stageKey: '', origin: 'skill' },
      }
    }
  }
}

function collectExistingContent(skillNodeId: string, allNodes: ScriptFloraNode[], allEdges: ScriptFloraEdge[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const node of allNodes) {
    if (node.type !== 'content') continue
    if (!allEdges.some((e) => e.source === skillNodeId && e.target === node.id)) continue
    const d = node.data as ContentNodeData
    if ((d.locked || d.approved) && d.stageKey) result[d.stageKey] = d.content
  }
  return result
}

function reconcile(plan: GenerationPlan, skillNode: ScriptFloraNode, allNodes: ScriptFloraNode[], allEdges: ScriptFloraEdge[]): { nodes: ScriptFloraNode[]; edges: ScriptFloraEdge[] } {
  const existing = allNodes.filter((n) => n.type === 'content' && allEdges.some((e) => e.source === skillNode.id && e.target === n.id))
  const existingByKey = new Map(existing.filter((n) => (n.data as ContentNodeData).stageKey).map((n) => [(n.data as ContentNodeData).stageKey!, n]))

  // Phase 8: resolve the skill manifest so we can stamp provenance
  const selectedSkillId = (skillNode.data as { selected: SkillId | null }).selected ?? 'standard'
  const manifest = SKILL_MANIFESTS[selectedSkillId]
  const provenanceBase = manifest
    ? { skillId: manifest.skillId, skillVersion: manifest.version, publisherId: manifest.publisherId }
    : { skillId: selectedSkillId, skillVersion: '0.0.0', publisherId: 'local' }

  const newNodes: ScriptFloraNode[] = []

  for (const [i, stage] of plan.stages.entries()) {
    const match = existingByKey.get(stage.stageKey)
    if (match) {
      const d = match.data as ContentNodeData
      if (d.locked || d.approved) continue
      ;(match.data as ContentNodeData).content = stage.content
      ;(match.data as ContentNodeData).status = 'draft'
      ;(match.data as ContentNodeData).label = stage.label
      // Back-fill provenance on existing nodes that predate Phase 8
      if (!d.provenance) {
        ;(match.data as ContentNodeData).origin = 'skill'
        ;(match.data as ContentNodeData).provenance = { ...provenanceBase, skillNodeKey: stage.kind }
        ;(match.data as ContentNodeData).contract = CONTENT_NODE_CONTRACTS[stage.kind as ContentKind]
      }
    } else {
      const col = Math.floor(i / 6)
      const row = i % 6
      newNodes.push({
        id: nextId('content'), type: 'content',
        position: { x: skillNode.position.x + 420 + col * 380, y: skillNode.position.y - 100 + row * 230 },
        data: {
          kind: stage.kind as ContentKind,
          label: stage.label,
          content: stage.content,
          status: 'draft',
          stageKey: stage.stageKey,
          index: stage.index,
          tokens: Math.round(stage.content.length * 1.4),
          progress: 100,
          // Phase 8 fields
          origin: 'skill',
          provenance: { ...provenanceBase, skillNodeKey: stage.kind },
          contract: CONTENT_NODE_CONTRACTS[stage.kind as ContentKind],
        },
      })
    }
  }

  const nodes = [...allNodes, ...newNodes]
  const allContentIds = new Set([...existing.map((n) => n.id), ...newNodes.map((n) => n.id)])
  const keptEdges = allEdges.filter((e) => !(e.source === skillNode.id && allContentIds.has(e.target)))

  // Skill → content fan-out edges
  const skillToContent: ScriptFloraEdge[] = [...existing.map((n) => n.id), ...newNodes.map((n) => n.id)].map((targetId) => ({
    id: `${skillNode.id}->${targetId}`,
    source: skillNode.id,
    target: targetId,
    type: 'smoothstep' as const,
    animated: false,
    data: { flowing: false },
  }))

  // ── Auto-connect downstream nodes ────────────────────────────────────────
  const allContentNodeIds = [...existing.map((n) => n.id), ...newNodes.map((n) => n.id)]
  const autoEdges: ScriptFloraEdge[] = []

  const edgeExists = (source: string, target: string) =>
    keptEdges.some((e) => e.source === source && e.target === target) ||
    skillToContent.some((e) => e.source === source && e.target === target) ||
    autoEdges.some((e) => e.source === source && e.target === target)

  const addEdgeIfMissing = (source: string, target: string) => {
    if (!edgeExists(source, target)) {
      autoEdges.push({ id: `${source}->${target}`, source, target, type: 'smoothstep', animated: false, data: { flowing: false } })
    }
  }

  const continuityNodes = allNodes.filter((n) => n.type === 'continuity')
  const outputNodes = allNodes.filter((n) => n.type === 'output')
  const exportNodes = allNodes.filter((n) => n.type === 'export')

  for (const contentId of allContentNodeIds) {
    for (const cn of continuityNodes) addEdgeIfMissing(contentId, cn.id)
    for (const on of outputNodes) addEdgeIfMissing(contentId, on.id)
  }

  for (const en of exportNodes) {
    const upstreamNodes = [...continuityNodes, ...outputNodes]
    if (upstreamNodes.length > 0) {
      for (const up of upstreamNodes) addEdgeIfMissing(up.id, en.id)
    } else if (allContentNodeIds.length > 0) {
      addEdgeIfMissing(allContentNodeIds[allContentNodeIds.length - 1], en.id)
    }
  }

  return { nodes, edges: [...keptEdges, ...skillToContent, ...autoEdges] }
}

function Flow({ projectId }: { projectId: string }) {
  const saved = loadProjectGraph(projectId)
  const initialNodes = (saved?.nodes as ScriptFloraNode[] | undefined) ?? []
  const initialEdges = (saved?.edges as ScriptFloraEdge[] | undefined) ?? []

  // Seed counter so new ids never collide with restored ones
  seedIdCounter(initialNodes)

  const [nodes, setNodes, onNodesChange] = useNodesState<ScriptFloraNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<ScriptFloraEdge>(initialEdges)

  const [projectName, setProjectName] = useState(() => {
    if (typeof window === 'undefined') return 'Untitled project'
    try {
      const list = JSON.parse(localStorage.getItem('sf:projects') ?? '[]') as Array<{ id: string; name: string }>
      return list.find((p) => p.id === projectId)?.name ?? 'Untitled project'
    } catch { return 'Untitled project' }
  })

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('pointer')
  const [showHelp, setShowHelp] = useState(false)
  const [generateState, setGenerateState] = useState<GenerateState>('idle')

  // C1 — auth for Coach state
  const auth = useAuth()
  const hasChatGPTLogin = auth.status === 'authenticated'

  // P1 — track selected node for Inspector panel
  const selectedNode = useMemo(
    () => nodes.find((n) => n.selected) ?? null,
    [nodes]
  )

  // C1 — derive coach state from canvas nodes
  const coachState = useMemo(
    () => deriveCoachState(nodes, hasChatGPTLogin, '/canvas'),
    // ponytail: recompute only when nodes array reference changes (saved per frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, hasChatGPTLogin],
  )

  // Single source of truth for generation settings — persisted to localStorage
  const [settings, setSettings] = useState<GenerationSettings>(() => {
    if (typeof window === 'undefined') return { model: 'gpt-5.4-mini', fast: false, reasoning: 'medium' }
    try {
      const saved = localStorage.getItem('sf:gen-settings')
      if (saved) {
        const parsed = JSON.parse(saved) as GenerationSettings
        // Migrate old gpt-4o defaults to supported model
        if (parsed.model === 'gpt-4o' || parsed.model === 'gpt-4o-mini') {
          parsed.model = 'gpt-5.4-mini'
        }
        return parsed
      }
    } catch { /* ignore */ }
    return { model: 'gpt-5.4-mini', fast: false, reasoning: 'medium' }
  })

  const handleSettingsChange = useCallback((next: GenerationSettings) => {
    setSettings(next)
    localStorage.setItem('sf:gen-settings', JSON.stringify(next))
  }, [])

  const { screenToFlowPosition, fitView } = useReactFlow()
  const timers = useRef<number[]>([])
  const activeGenId = useRef<string | null>(null)
  // Stable ref so the keydown closure can call fitView without a stale capture
  const fitViewRef = useRef(fitView)
  useEffect(() => { fitViewRef.current = fitView }, [fitView])

  // Autosave + expose nodes for export
  useEffect(() => {
    ;(window as unknown as Record<string, unknown>).__ScriptFloraNodes = nodes
    saveProjectGraph(projectId, nodes, edges)
    updateProject(projectId, { nodeCount: nodes.filter((n) => n.type === 'content').length })
  }, [nodes, edges, projectId])

  // Session keep-alive check — poll every 4 min; redirect on expiry
  // ponytail: 4 min < typical 5-min idle timeout; single HEAD-like GET is cheap
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_LWC_ENABLED && !document.cookie.includes('lwc_session=')) return
    const check = async () => {
      try {
        const res = await fetch('/api/chatgpt/session', { method: 'GET', credentials: 'include' })
        if (res.status === 401) window.location.href = '/?session=expired'
      } catch { /* network error — don't log out, just skip */ }
    }
    const id = window.setInterval(check, 4 * 60 * 1000)
    return () => window.clearInterval(id)
  }, [])

  // P1 — auto-show Inspector panel when a node is selected
  useEffect(() => {
    if (selectedNode) panelActions.setVisible('inspector', true)
  }, [selectedNode?.id])

  useEffect(() => () => { for (const t of timers.current) window.clearTimeout(t) }, [])

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  // Skip when focus is inside an input/textarea so typing isn't intercepted.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const editable = (e.target as HTMLElement).isContentEditable
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || editable) return

      const meta = e.metaKey || e.ctrlKey

      // ? — toggle shortcut help
      if (e.key === '?') { e.preventDefault(); setShowHelp((v) => !v); return }
      // Escape — close help or deselect
      if (e.key === 'Escape') { setShowHelp(false); return }
      // Cmd/Ctrl+J — toggle Coach panel
      if (meta && e.key === 'j') { e.preventDefault(); panelActions.setVisible('coach', true); panelActions.bringToFront('coach'); return }

      // Delete / Backspace — delete selected nodes (locked nodes skipped) + selected edges
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        // Delete selected edges first
        setEdges((cur) => cur.filter((ed) => !ed.selected))
        // Then delete selected unlocked nodes and their connected edges
        setNodes((cur) => {
          const toDelete = new Set(cur.filter((n) => n.selected && !n.data.locked).map((n) => n.id))
          if (toDelete.size === 0) return cur
          setEdges((edges) => edges.filter((ed) => !toDelete.has(ed.source) && !toDelete.has(ed.target)))
          return cur.filter((n) => !toDelete.has(n.id))
        })
        return
      }

      // L — lock selected nodes
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        setNodes((cur) => cur.map((n) => n.selected ? { ...n, data: { ...n.data, locked: true } } as typeof n : n))
        return
      }

      // U — unlock selected nodes
      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault()
        setNodes((cur) => cur.map((n) => n.selected ? { ...n, data: { ...n.data, locked: false } } as typeof n : n))
        return
      }

      // A — approve selected content nodes
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        setNodes((cur) => cur.map((n) => {
          if (!n.selected || n.type !== 'content') return n
          return { ...n, data: { ...n.data, approved: true, status: 'approved' } } as typeof n
        }))
        return
      }

      // Cmd/Ctrl + D — duplicate selected nodes
      if (meta && e.key === 'd') {
        e.preventDefault()
        setNodes((cur) => {
          const selected = cur.filter((n) => n.selected)
          if (selected.length === 0) return cur
          const clones = selected.map((n) => ({
            ...n,
            id: nextId(n.type ?? 'node'),
            position: { x: n.position.x + 40, y: n.position.y + 40 },
            selected: false,
            data: { ...n.data, approved: false, locked: false, stageKey: '' },
          } as typeof n))
          return [...cur, ...clones]
        })
        return
      }

      // S — switch pointer ↔ select mode
      if (e.key === 's' || e.key === 'S') {
        if (meta) return // Cmd+S = browser save, ignore
        e.preventDefault()
        setCanvasMode((m) => m === 'pointer' ? 'select' : 'pointer')
        return
      }

      // F — fit view
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        // fitView is accessible via useReactFlow — call it via the ref
        fitViewRef.current?.()
        return
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [setNodes, setEdges])

  const update = useCallback((id: string, patch: Record<string, unknown>) => {
    setNodes((cur) => cur.map((n) => n.id === id ? ({ ...n, data: { ...n.data, ...patch } } as ScriptFloraNode) : n))
  }, [setNodes])

  // Single-node regenerate via API
  const regenerateSingleNode = useCallback(async (id: string, allNodes: ScriptFloraNode[], allEdges: ScriptFloraEdge[]) => {
    const node = allNodes.find((n) => n.id === id)
    if (!node || node.type !== 'content') return
    const d = node.data as ContentNodeData
    if (d.locked) return

    const skillNode = allNodes.find((n) => n.type === 'skill' && allEdges.some((e) => e.source === n.id && e.target === id))
    const briefNode = skillNode ? allNodes.find((n) => n.type === 'brief' && allEdges.some((e) => e.source === n.id && e.target === skillNode.id)) : null

    // No upstream brief+skill — show a simulated pass
    if (!skillNode || skillNode.type !== 'skill' || !briefNode || briefNode.type !== 'brief') {
      update(id, { status: 'generating', progress: 0 })
      let p = 0
      const prog = window.setInterval(() => { p = Math.min(p + 12, 90); update(id, { progress: p }) }, 160)
      timers.current.push(window.setTimeout(() => { window.clearInterval(prog); update(id, { status: 'draft', progress: 100 }) }, 1800))
      return
    }

    const skill = (skillNode.data as { selected: SkillId | null }).selected
    if (!skill) return

    update(id, { status: 'generating', progress: 0 })
    let p = 0
    const prog = window.setInterval(() => { p = Math.min(p + 8, 85); update(id, { progress: p }) }, 200)

    const brief = briefNode.data as BriefNodeData
    const nodePrompt = d.prompt?.trim() ? `\n\nNode-level prompt override: ${d.prompt.trim()}` : ''
    const req: GenerationRequest = {
      brief: { ...brief, additionalNotes: `${brief.additionalNotes ?? ''}\n\nRegenerate only: "${d.label}" (stageKey: ${d.stageKey ?? d.kind}).${nodePrompt}`.trim() },
      skill,
      skillMarkdown: (skillNode.data as { skillMarkdown?: string }).skillMarkdown ?? '',
      existingContent: { [d.stageKey ?? '']: d.content },
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sf-model': settings.model,
          'x-sf-reasoning-effort': settings.reasoning,
          ...(settings.fast ? { 'x-sf-service-tier': 'fast' } : {}),
        },
        body: JSON.stringify(req),
      })
      window.clearInterval(prog)
      if (!res.ok) throw new Error((await res.json()).error ?? res.statusText)
      const plan: GenerationPlan = await res.json()
      const match = plan.stages.find((s) => s.kind === d.kind && s.index === d.index)
      if (match) {
        update(id, { content: match.content, status: 'draft', progress: 100, tokens: Math.round(match.content.length * 1.4) })
      } else {
        update(id, { status: 'draft', progress: 100 })
      }
    } catch (err) {
      window.clearInterval(prog)
      update(id, { status: 'error', progress: 0 })
      console.error('[regenerate single]', err)
    }
  }, [update, settings])

  const act = useCallback((id: string, action: NodeAction) => {
    switch (action) {
      case 'lock': update(id, { locked: true }); break
      case 'unlock': update(id, { locked: false }); break
      case 'approve': update(id, { approved: true, status: 'approved' }); break
      case 'unapprove': update(id, { approved: false, status: 'draft' }); break
      case 'delete':
        setNodes((c) => c.filter((n) => n.id !== id))
        setEdges((c) => c.filter((e) => e.source !== id && e.target !== id))
        break
      case 'duplicate':
        setNodes((c) => {
          const src = c.find((n) => n.id === id)
          if (!src) return c
          return [...c, { ...src, id: nextId(src.type ?? 'node'), position: { x: src.position.x + 40, y: src.position.y + 40 }, selected: false, data: { ...src.data, approved: false, locked: false, stageKey: '' } } as ScriptFloraNode]
        })
        break
      case 'regenerate':
        setNodes((cur) => { setEdges((curE) => { void regenerateSingleNode(id, cur, curE); return curE }); return cur })
        break
    }
  }, [update, setNodes, setEdges, regenerateSingleNode])

  // Ref so actExtended can call handleGenerate without a circular dep
  const handleGenerateRef = useRef<(() => Promise<void>) | undefined>(undefined)

  // Continuity/output nodes get a simulated regenerate; skill nodes trigger full generation
  const actExtended = useCallback((id: string, action: NodeAction) => {
    if (action === 'regenerate') {
      const node = nodes.find((n) => n.id === id)

      // Skill node → run the full pipeline generate
      if (node?.type === 'skill') {
        void handleGenerateRef.current?.()
        return
      }

      if (node?.type === 'continuity' || node?.type === 'output') {
        update(id, { status: 'generating' })
        let p = 0
        const prog = window.setInterval(() => { p = Math.min(p + 10, 90); update(id, { progress: p }) }, 180)
        timers.current.push(window.setTimeout(() => {
          window.clearInterval(prog)
          setNodes((c) => c.map((n) => {
            if (n.id !== id) return n
            if (n.type === 'continuity') return { ...n, data: { ...n.data, status: 'draft', progress: 100, score: 94, checkedAt: 'just now', issues: [] } } as ScriptFloraNode
            return { ...n, data: { ...n.data, status: 'draft', progress: 100 } } as ScriptFloraNode
          }))
        }, 1900))
        return
      }
    }
    act(id, action)
  }, [act, nodes, update, setNodes])

  const actions = useMemo(() => ({ update, act: actExtended }), [update, actExtended])

  // Full-pipeline generate
  const handleGenerate = useCallback(async () => {
    const skillNode = nodes.find((n) => n.type === 'skill')
    const skill = skillNode?.type === 'skill' ? (skillNode.data as { selected: SkillId | null }).selected : null

    if (!skillNode || !skill) {
      toast.warning('No skill selected', { message: 'Add a Skill node and select Standard or Auteur.' })
      setGenerateState('preflight-error')
      return
    }
    const briefNode = nodes.find((n) => n.type === 'brief' && edges.some((e) => e.source === n.id && e.target === skillNode.id))
    if (!briefNode || briefNode.type !== 'brief') {
      toast.warning('Brief not connected', { message: 'Connect a Brief node to the Skill node first.' })
      setGenerateState('preflight-error')
      return
    }
    const brief = briefNode.data as BriefNodeData
    if (!brief.title && !brief.objective) {
      toast.warning('Brief is empty', { message: 'Fill in at least a title or objective in the Brief.' })
      setGenerateState('preflight-error')
      return
    }
    if (brief.status !== 'approved') {
      toast.warning('Brief not confirmed', {
        message: 'Confirm the Brief before generating — click "Confirm Brief" on the Brief node.',
        duration: 8000,
      })
      setGenerateState('preflight-error')
      return
    }

    // Phase S0: validate skill manifest requires.locks
    const manifest = SKILL_MANIFESTS[skill]
    if (manifest?.requires?.locks?.length) {
      const missingLocks: string[] = []
      for (const requiredType of manifest.requires.locks) {
        const node = nodes.find((n) => n.type === requiredType)
        const isLocked = node?.data && (
          requiredType === 'character-bible'
            ? (node.data as { characters?: Array<{ status: string; referenceImageUrl?: string }> })
                .characters?.some((c) => c.status === 'locked' && c.referenceImageUrl)
            : Boolean((node?.data as { locked?: boolean } | undefined)?.locked)
        )
        if (!isLocked) missingLocks.push(requiredType)
      }
      if (missingLocks.length > 0) {
        const labels: Record<string, string> = {
          'character-bible': 'Character Bible — lock at least one character with a reference image',
          'style-lock': 'World / Style Lock — lock the style rules first',
        }
        const missing = missingLocks.map((t) => labels[t] ?? t).join('\n')
        toast.error(`"${manifest.name}" requires:`, { message: missing, duration: 0 })
        setGenerateState('preflight-error')
        return
      }
    }

    // Phase S0: validate skill manifest requires.nodes
    if (manifest?.requires?.nodes?.length) {
      const missingNodes = manifest.requires.nodes.filter(
        (requiredType) => !nodes.some((n) => n.type === requiredType)
      )
      if (missingNodes.length > 0) {
        const labels: Record<string, string> = {
          'episode-memory': 'Episode Memory node (for multi-episode continuity)',
        }
        const missing = missingNodes.map((t) => labels[t] ?? t).join(', ')
        toast.info(`"${manifest.name}" works best with: ${missing}`, {
          message: 'Generation will continue — add the node for best results.',
          duration: 8000,
        })
        // ponytail: soft warning, not a block
      }
    }

    setGenerateState('generating')
    setEdges((c) => c.map((e) => e.source === skillNode.id ? { ...e, data: { flowing: true } } : e))

    const genId = nanoid(6)
    activeGenId.current = genId

    const req: GenerationRequest = {
      brief,
      skill,
      skillMarkdown: (skillNode.data as { skillMarkdown?: string }).skillMarkdown ?? '',
      existingContent: collectExistingContent(skillNode.id, nodes, edges),
    }

    // Phase 1: collect locked Character Bible + Style Lock and inject into request
    const biblNode = nodes.find((n) => n.type === 'character-bible')
    const stylNode = nodes.find((n) => n.type === 'style-lock')
    type ContinuityCtx = { characters?: unknown[]; styleLock?: unknown }
    const continuityContext: ContinuityCtx = {}
    if (biblNode?.type === 'character-bible') {
      const chars = (biblNode.data as { characters?: Array<{ status: string; name: string; role: string; visualDescription: string; wardrobe: string; voiceProfile: unknown }> }).characters ?? []
      const locked = chars.filter((c) => c.status === 'locked')
      if (locked.length > 0) continuityContext.characters = locked
    }
    if (stylNode?.type === 'style-lock' && stylNode.data.locked) {
      continuityContext.styleLock = stylNode.data
    }

    const reqWithContext = Object.keys(continuityContext).length > 0
      ? { ...req, continuityContext }
      : req

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sf-model': settings.model,
          'x-sf-reasoning-effort': settings.reasoning,
          ...(settings.fast ? { 'x-sf-service-tier': 'fast' } : {}),
        },
        body: JSON.stringify(reqWithContext),
      })

      if (activeGenId.current !== genId) return

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        if (res.status === 401) {
          window.location.href = '/?session=expired'
          return
        }
        toast.error('Generation failed', { message: body.error ?? 'Unknown error. Try again.' })
        setGenerateState('error')
        setEdges((c) => c.map((e) => ({ ...e, data: { flowing: false } })))
        return
      }

      const plan: GenerationPlan = await res.json()
      if (activeGenId.current !== genId) return

      const { nodes: nextNodes, edges: nextEdges } = reconcile(plan, skillNode, nodes, edges)
      setNodes(nextNodes)
      setEdges(nextEdges.map((e) => ({ ...e, data: { flowing: false } })))
      setGenerateState('idle')
      toast.success('Script generated', { message: `${plan.stages.length} stage${plan.stages.length === 1 ? '' : 's'} created.` })
    } catch (err) {
      if (activeGenId.current !== genId) return
      toast.error('Generation failed', { message: err instanceof Error ? err.message : 'Unknown error.' })
      setGenerateState('error')
      setEdges((c) => c.map((e) => ({ ...e, data: { flowing: false } })))
    }
  }, [nodes, edges, setNodes, setEdges, settings])

  // Keep the ref in sync so actExtended can call handleGenerate without circular deps
  useEffect(() => { handleGenerateRef.current = handleGenerate }, [handleGenerate])

  const onConnect: OnConnect = useCallback((connection: Connection) => setEdges((c) => addEdge({ ...connection, type: 'smoothstep' }, c)), [setEdges])

  const handlePaneDoubleClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    if (target.classList.contains('react-flow__pane') || target.classList.contains('react-flow__background')) {
      setMenu({ x: event.clientX, y: event.clientY })
    }
  }, [])

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    const target = event.target as HTMLElement
    if (target.classList.contains('react-flow__pane') || target.classList.contains('react-flow__background')) {
      setCtxMenu({ x: event.clientX, y: event.clientY })
    }
  }, [])

  // Shared helper: wire a newly-added downstream node to all existing content nodes
  const autoWireNode = useCallback((newNode: ScriptFloraNode, type: string) => {
    setEdges((curEdges) => {
      setNodes((curNodes) => {
        const contentNodes = curNodes.filter((n) => n.type === 'content')
        const continuityNodes = curNodes.filter((n) => n.type === 'continuity' && n.id !== newNode.id)
        const outputNodes = curNodes.filter((n) => n.type === 'output' && n.id !== newNode.id)

        const seen = new Set(curEdges.map((e) => e.id))
        const extra: ScriptFloraEdge[] = []
        const add = (src: string, tgt: string) => {
          const id = `${src}->${tgt}`
          if (!seen.has(id)) { seen.add(id); extra.push({ id, source: src, target: tgt, type: 'smoothstep', animated: false, data: { flowing: false } }) }
        }

        if (type === 'continuity' || type === 'output') {
          for (const cn of contentNodes) add(cn.id, newNode.id)
        }
        if (type === 'export') {
          const upstream = [...continuityNodes, ...outputNodes]
          if (upstream.length > 0) {
            for (const up of upstream) add(up.id, newNode.id)
          } else if (contentNodes.length > 0) {
            add(contentNodes[contentNodes.length - 1].id, newNode.id)
          }
        }

        if (extra.length > 0) {
          // Schedule the edge update outside this setNodes callback to avoid nesting
          setTimeout(() => setEdges((e) => {
            const ids = new Set(e.map((x) => x.id))
            return [...e, ...extra.filter((x) => !ids.has(x.id))]
          }), 0)
        }
        return curNodes
      })
      return curEdges
    })
  }, [setNodes, setEdges])

  const handleAddNode = useCallback((request: AddNodeRequest) => {
    if (!menu) return
    const newNode = buildNode(request, screenToFlowPosition({ x: menu.x, y: menu.y }))
    setNodes((c) => [...c, newNode])
    if (request.type === 'continuity' || request.type === 'output' || request.type === 'export') {
      autoWireNode(newNode, request.type)
    }
    setMenu(null)
  }, [menu, screenToFlowPosition, setNodes, autoWireNode])

  const addBrief = useCallback(() => setNodes((c) => [...c, buildNode({ type: 'brief' }, { x: 0, y: 0 })]), [setNodes])

  const handleDropNode = useCallback((request: AddNodeRequest, event: React.DragEvent | React.MouseEvent) => {
    const point = 'clientX' in event ? { x: event.clientX, y: event.clientY } : { x: 180, y: 180 }
    const newNode = buildNode(request, screenToFlowPosition(point))
    setNodes((c) => [...c, newNode])
    if (request.type === 'continuity' || request.type === 'output' || request.type === 'export') {
      autoWireNode(newNode, request.type)
    }
  }, [screenToFlowPosition, setNodes, autoWireNode])

  const handleCanvasDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const raw = event.dataTransfer.getData('application/ScriptFlora-node')
    if (!raw) return
    try { handleDropNode(JSON.parse(raw) as AddNodeRequest, event) } catch { /* ignore malformed */ }
  }, [handleDropNode])

  const styledEdges = useMemo(() => edges.map((e) => ({
    ...e,
    className: e.data?.flowing ? 'edge-flowing' : undefined,
    style: e.data?.flowing ? { stroke: 'oklch(0.685 0.152 296 / 52%)', strokeWidth: 1 } : undefined,
  })), [edges])

  return (
    <NodeActionProvider value={actions}>
      <div className="bg-canvas relative h-dvh w-full">
        <ReactFlow<ScriptFloraNode, ScriptFloraEdge>
          nodes={nodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDoubleClick={handlePaneDoubleClick}
          onContextMenu={handlePaneContextMenu}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
          onDrop={handleCanvasDrop}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 0.85 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          selectionOnDrag={canvasMode === 'select'}
          panOnDrag={canvasMode === 'pointer'}
          panOnScroll
          zoomOnDoubleClick={false}
          nodesDraggable
          elevateNodesOnSelect
          elevateEdgesOnSelect
          // Let our custom keydown handler own deletion so we can respect locked nodes
          deleteKeyCode={null}
          // Shift = add to selection
          multiSelectionKeyCode="Shift"
        >
          <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="oklch(1 0 0 / 7%)" />
          <MiniMap
            pannable zoomable ariaLabel="Canvas minimap"
            nodeColor={(n) => MINIMAP_COLOR[n.type ?? ''] ?? '#3a3a3d'}
            nodeStrokeWidth={0} nodeBorderRadius={3}
            maskColor="oklch(0.145 0.004 285 / 0.72)"
            style={{ width: 168, height: 112, background: 'oklch(0.185 0.005 285 / 0.9)', border: '1px solid oklch(1 0 0 / 8%)', backdropFilter: 'blur(12px)', right: 16, bottom: 16, margin: 0 }}
          />
        </ReactFlow>

        <FloatingSidebar onDropNode={handleDropNode} projectId={projectId} />

        {/* P1 — Detachable panels */}
        <NodesLibraryPanel onDropNode={handleDropNode} projectId={projectId} />
        <InspectorPanel selectedNode={selectedNode} />
        {/* C1 — Coach panel */}
        <CoachPanel coachState={coachState} />

        <TopBar
          projectName={projectName}
          onProjectNameChange={(name) => { setProjectName(name); updateProject(projectId, { name }) }}
          nodeCount={nodes.length}
          onGenerate={handleGenerate}
          generateState={generateState}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          panelToggles={
            <>
              <PanelToggleButton panelId="nodes-library" icon={Layers} label="Nodes" />
              <PanelToggleButton panelId="inspector" icon={Info} label="Inspector" />
              <PanelToggleButton panelId="coach" icon={Bot} label="Coach" />
            </>
          }
        />
        <CanvasControls mode={canvasMode} onModeChange={setCanvasMode} onShowHelp={() => setShowHelp(true)} />
        <ToastStack />

        {nodes.length === 0 && <EmptyState onAddBrief={addBrief} />}
        {menu && <AddNodeMenu position={menu} onSelect={handleAddNode} onClose={() => setMenu(null)} />}
        {ctxMenu && (
          <CanvasContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            onAddNode={() => { setMenu(ctxMenu); setCtxMenu(null) }}
            onClose={() => setCtxMenu(null)}
          />
        )}

        {/* Keyboard shortcut help overlay */}
        {showHelp && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            onMouseDown={() => setShowHelp(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[oklch(0.16_0.005_285)] p-5 shadow-2xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[13px] font-medium text-foreground">Keyboard shortcuts</h2>
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  className="text-muted-foreground hover:text-foreground text-[18px] leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="space-y-1">
                {[
                  ['Delete / ⌫', 'Delete selected nodes (locked nodes are skipped) or edges'],
                  ['Click edge', 'Select an edge — then Delete to remove it'],
                  ['Shift + click', 'Add node to selection'],
                  ['⌘D / Ctrl+D', 'Duplicate selected nodes'],
                  ['L', 'Lock selected nodes'],
                  ['U', 'Unlock selected nodes'],
                  ['A', 'Approve selected content nodes'],
                  ['S', 'Toggle pointer ↔ select mode'],
                  ['F', 'Fit view'],
                  ['?', 'Toggle this help panel'],
                  ['Esc', 'Close panels / deselect'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/[0.04]">
                    <span className="text-[11.5px] text-muted-foreground">{desc}</span>
                    <kbd className="ml-4 shrink-0 rounded-md border border-white/[0.12] bg-white/[0.06] px-2 py-0.5 font-mono text-[10.5px] text-foreground/80">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[10.5px] text-muted-foreground/60">
                Shortcuts are disabled while typing in a node field.
              </p>
            </div>
          </div>
        )}
      </div>
    </NodeActionProvider>
  )
}

export function ScriptFloraCanvas({ projectId }: { projectId: string }) {
  return (
    <ReactFlowProvider>
      <Flow projectId={projectId} />
    </ReactFlowProvider>
  )
}

// Alias so canvas-client.tsx can import either name without breaking
export { ScriptFloraCanvas as ScriptFlowCanvas }
