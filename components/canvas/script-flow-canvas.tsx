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
  stageKey,
  type BriefNodeData,
  type ContentKind,
  type ContentNodeData,
  type GenerationPlan,
  type GenerationRequest,
  type NodeAction,
  type ScriptFloraEdge,
  type ScriptFloraNode,
  type ScriptFloraNodeType,
  type SkillId,
} from '@/lib/flow-types'
import { initialEdges, initialNodes } from '@/lib/initial-graph'
import { loadProjectGraph, saveProjectGraph, updateProject } from '@/lib/store'
import { NodeActionProvider } from './node-action-context'
import { BriefNode } from '@/components/nodes/brief-node'
import { SkillNode } from '@/components/nodes/skill-node'
import { ContentNode } from '@/components/nodes/content-node'
import { ContinuityNode } from '@/components/nodes/continuity-node'
import { OutputNode } from '@/components/nodes/output-node'
import { ExportNode } from '@/components/nodes/export-node'
import { TopBar, type GenerateState } from './top-bar'
import { CanvasControls } from './canvas-controls'
import { AddNodeMenu, type AddNodeRequest } from './add-node-menu'
import { EmptyState } from './empty-state'
import { FloatingSidebar } from './floating-sidebar'
import { nanoid } from 'nanoid'

export { type AddNodeRequest }

const nodeTypes: NodeTypes = {
  brief: BriefNode,
  skill: SkillNode,
  content: ContentNode,
  continuity: ContinuityNode,
  output: OutputNode,
  export: ExportNode,
}

const MINIMAP_COLOR: Record<string, string> = {
  brief: 'oklch(0.42 0.02 285)',
  skill: 'oklch(0.42 0.02 285)',
  content: 'oklch(0.38 0.015 285)',
  continuity: 'oklch(0.5 0.09 296)',
  output: 'oklch(0.5 0.09 296)',
  export: 'oklch(0.6 0.13 296)',
}

let idCounter = 100
const nextId = (prefix: string) => `${prefix}-${++idCounter}`

function buildNode(
  request: AddNodeRequest,
  position: { x: number; y: number },
): ScriptFloraNode {
  const { type, kind } = request
  switch (type) {
    case 'brief':
      return {
        id: nextId('brief'),
        type: 'brief',
        position,
        data: {
          title: '',
          objective: '',
          audience: '',
          platforms: [],
          duration: '',
          tone: 'cinematic',
          keyFacts: [],
          additionalNotes: '',
          status: 'empty',
        },
      }
    case 'skill':
      return { id: nextId('skill'), type: 'skill', position, data: { selected: null } }
    case 'continuity':
      return {
        id: nextId('continuity'),
        type: 'continuity',
        position,
        data: { status: 'empty', score: 0, checkedAt: null, issues: [] },
      }
    case 'output':
      return {
        id: nextId('output'),
        type: 'output',
        position,
        data: {
          status: 'empty',
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
      return {
        id: nextId('export'),
        type: 'export',
        position,
        data: { status: 'empty', format: 'md', includeNotes: false, filename: 'untitled-script' },
      }
    case 'content':
    default: {
      const contentKind: ContentKind = kind ?? 'scene'
      return {
        id: nextId('content'),
        type: 'content',
        position,
        data: {
          kind: contentKind,
          label: CONTENT_KIND_META[contentKind].label,
          content: '',
          prompt: '',
          progress: 0,
          status: 'empty',
          tokens: 0,
          stageKey: '',
        },
      }
    }
  }
}

/** Find the brief→skill path from a given node id (could be brief or skill). */
function resolvePipeline(
  nodeId: string,
  allNodes: ScriptFloraNode[],
  allEdges: ScriptFloraEdge[],
): { brief: ScriptFloraNode | null; skill: ScriptFloraNode | null } {
  const node = allNodes.find((n) => n.id === nodeId)
  if (!node) return { brief: null, skill: null }

  if (node.type === 'skill') {
    const brief = allNodes.find(
      (n) => n.type === 'brief' && allEdges.some((e) => e.source === n.id && e.target === node.id),
    )
    return { brief: brief ?? null, skill: node }
  }

  if (node.type === 'brief') {
    const skill = allNodes.find(
      (n) => n.type === 'skill' && allEdges.some((e) => e.source === node.id && e.target === n.id),
    )
    return { brief: node, skill: skill ?? null }
  }

  return { brief: null, skill: null }
}

/** Gather existing locked/approved content keyed by stageKey for the prompt. */
function collectExistingContent(
  skillNodeId: string,
  allNodes: ScriptFloraNode[],
  allEdges: ScriptFloraEdge[],
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const node of allNodes) {
    if (node.type !== 'content') continue
    const connected = allEdges.some((e) => e.source === skillNodeId && e.target === node.id)
    if (!connected) continue
    const d = node.data as ContentNodeData
    if ((d.locked || d.approved) && d.stageKey) {
      result[d.stageKey] = d.content
    }
  }
  return result
}

/** Reconcile returned plan stages onto the canvas. Returns new nodes + edges. */
function reconcile(
  plan: GenerationPlan,
  skillNode: ScriptFloraNode,
  allNodes: ScriptFloraNode[],
  allEdges: ScriptFloraEdge[],
): { nodes: ScriptFloraNode[]; edges: ScriptFloraEdge[] } {
  // Existing content nodes connected to this skill
  const existing = allNodes.filter(
    (n) => n.type === 'content' && allEdges.some((e) => e.source === skillNode.id && e.target === n.id),
  )
  const existingByKey = new Map(
    existing
      .filter((n) => (n.data as ContentNodeData).stageKey)
      .map((n) => [(n.data as ContentNodeData).stageKey!, n]),
  )

  const updatedIds = new Set<string>()
  const newNodes: ScriptFloraNode[] = []

  for (const [i, stage] of plan.stages.entries()) {
    const match = existingByKey.get(stage.stageKey)
    if (match) {
      updatedIds.add(match.id)
      const d = match.data as ContentNodeData
      // Preserve locked/approved nodes verbatim
      if (d.locked || d.approved) continue
      // Update in place — will be patched into allNodes below
      ;(match.data as ContentNodeData).content = stage.content
      ;(match.data as ContentNodeData).status = 'draft'
      ;(match.data as ContentNodeData).label = stage.label
    } else {
      // New node — fan-out position from skill node
      const col = Math.floor(i / 6)
      const row = i % 6
      const pos = {
        x: skillNode.position.x + 420 + col * 380,
        y: skillNode.position.y - 100 + row * 230,
      }
      const newNode: ScriptFloraNode = {
        id: nextId('content'),
        type: 'content',
        position: pos,
        data: {
          kind: stage.kind as ContentKind,
          label: stage.label,
          content: stage.content,
          status: 'draft',
          stageKey: stage.stageKey,
          index: stage.index,
          tokens: Math.round(stage.content.length * 1.4),
          progress: 100,
        },
      }
      newNodes.push(newNode)
    }
  }

  // Updated node list: original nodes with in-place mutations + new nodes
  const nodes = [...allNodes, ...newNodes]

  // Rebuild edges for all content nodes connected to this skill
  const allContentNodeIds = new Set([
    ...existing.map((n) => n.id),
    ...newNodes.map((n) => n.id),
  ])
  const keptEdges = allEdges.filter(
    (e) => !(e.source === skillNode.id && allContentNodeIds.has(e.target)),
  )
  const newEdges: ScriptFloraEdge[] = [...existing.map((n) => n.id), ...newNodes.map((n) => n.id)].map(
    (targetId) => ({
      id: `${skillNode.id}->${targetId}`,
      source: skillNode.id,
      target: targetId,
      type: 'smoothstep' as const,
      animated: false,
      data: { flowing: false },
    }),
  )

  return { nodes, edges: [...keptEdges, ...newEdges] }
}

function Flow({ projectId }: { projectId: string }) {
  const saved = loadProjectGraph(projectId)
  const [nodes, setNodes, onNodesChange] = useNodesState<ScriptFloraNode>(
    (saved?.nodes as ScriptFloraNode[] | undefined) ?? [],
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState<ScriptFloraEdge>(
    (saved?.edges as ScriptFloraEdge[] | undefined) ?? [],
  )
  const [projectName, setProjectName] = useState(() => {
    if (typeof window === 'undefined') return 'Untitled project'
    try {
      const list = JSON.parse(localStorage.getItem('sf:projects') ?? '[]') as Array<{ id: string; name: string }>
      return list.find((p) => p.id === projectId)?.name ?? 'Untitled project'
    } catch {
      return 'Untitled project'
    }
  })
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [generateState, setGenerateState] = useState<GenerateState>('idle')
  const [generateError, setGenerateError] = useState<string | undefined>()
  const [preflightMessage, setPreflightMessage] = useState<string | undefined>()

  const [model, setModel] = useState<string>(() => {
    if (typeof window === 'undefined') return 'gpt-5.5'
    return localStorage.getItem('sf:model') ?? 'gpt-5.5'
  })
  const [fastMode, setFastMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sf:fastMode') === 'true'
  })
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high'>(() => {
    if (typeof window === 'undefined') return 'medium'
    const saved = localStorage.getItem('sf:reasoningEffort')
    return saved === 'low' || saved === 'medium' || saved === 'high' ? saved : 'medium'
  })

  const handleModelChange = useCallback((newModel: string) => {
    setModel(newModel)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sf:model', newModel)
    }
  }, [])

  const handleFastModeChange = useCallback((val: boolean) => {
    setFastMode(val)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sf:fastMode', String(val))
    }
  }, [])

  const handleReasoningEffortChange = useCallback((val: 'low' | 'medium' | 'high') => {
    setReasoningEffort(val)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sf:reasoningEffort', val)
    }
  }, [])

  const { screenToFlowPosition } = useReactFlow()
  const timers = useRef<number[]>([])
  // generation ID guard — prevent stale responses overwriting newer state
  const activeGenId = useRef<string | null>(null)

  useEffect(() => {
    // Expose nodes to window for export-node Markdown serialization
    ;(window as unknown as Record<string, unknown>).__ScriptFloraNodes = nodes
    // Autosave graph to localStorage
    saveProjectGraph(projectId, nodes, edges)
    // Update node count in project store
    const contentCount = nodes.filter((n) => n.type === 'content').length
    updateProject(projectId, { nodeCount: contentCount })
  }, [nodes, edges, projectId])

  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t)
    },
    [],
  )

  /* -------------------- node data updates -------------------- */

  const update = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === id
            ? ({ ...node, data: { ...node.data, ...patch } } as ScriptFloraNode)
            : node,
        ),
      )
    },
    [setNodes],
  )

  /* -------------------- single-node regenerate -------------------- */

  const regenerateSingleNode = useCallback(
    async (id: string, allNodes: ScriptFloraNode[], allEdges: ScriptFloraEdge[]) => {
      const node = allNodes.find((n) => n.id === id)
      if (!node || node.type !== 'content') return
      const d = node.data as ContentNodeData
      if (d.locked) return

      // Find the skill node connected upstream
      const skillNode = allNodes.find(
        (n) => n.type === 'skill' && allEdges.some((e) => e.source === n.id && e.target === id),
      )
      const briefNode = skillNode
        ? allNodes.find(
            (n) => n.type === 'brief' && allEdges.some((e) => e.source === n.id && e.target === skillNode.id),
          )
        : null

      if (!skillNode || skillNode.type !== 'skill' || !briefNode || briefNode.type !== 'brief') {
        // Fallback: simulate
        update(id, { status: 'generating', progress: 0 })
        let p = 0
        const prog = window.setInterval(() => { p = Math.min(p + 12, 90); update(id, { progress: p }) }, 160)
        timers.current.push(
          window.setTimeout(() => {
            window.clearInterval(prog)
            update(id, { status: 'draft', progress: 100 })
          }, 1800),
        )
        return
      }

      const skill = (skillNode.data as { selected: SkillId | null }).selected
      if (!skill) return

      update(id, { status: 'generating', progress: 0 })
      let p = 0
      const prog = window.setInterval(() => { p = Math.min(p + 8, 85); update(id, { progress: p }) }, 200)

      const brief = briefNode.data as BriefNodeData
      const req: GenerationRequest = {
        brief,
        skill,
        skillMarkdown: (skillNode.data as { skillMarkdown?: string }).skillMarkdown ?? '',
        existingContent: { [d.stageKey ?? '']: d.content },
        model,
        fast: model === 'gpt-5.5' || model === 'gpt-5.4' ? fastMode : false,
        reasoningEffort: model === 'gpt-4o' ? undefined : reasoningEffort,
      }

      // Single-stage prompt: pass a hint in the notes
      req.brief = {
        ...brief,
        additionalNotes: `${brief.additionalNotes ?? ''}\n\nOnly regenerate the "${d.label}" stage (stageKey: ${d.stageKey ?? d.kind}).`.trim(),
      }

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    },
    [update, model, fastMode, reasoningEffort],
  )

  /* -------------------- node actions -------------------- */

  const act = useCallback(
    (id: string, action: NodeAction) => {
      switch (action) {
        case 'lock':
          update(id, { locked: true })
          break
        case 'unlock':
          update(id, { locked: false })
          break
        case 'approve':
          update(id, { approved: true, status: 'approved' })
          break
        case 'unapprove':
          update(id, { approved: false, status: 'draft' })
          break
        case 'delete':
          setNodes((current) => current.filter((n) => n.id !== id))
          setEdges((current) => current.filter((e) => e.source !== id && e.target !== id))
          break
        case 'duplicate': {
          setNodes((current) => {
            const source = current.find((n) => n.id === id)
            if (!source) return current
            const clone = {
              ...source,
              id: nextId(source.type ?? 'node'),
              position: { x: source.position.x + 40, y: source.position.y + 40 },
              selected: false,
              data: { ...source.data, approved: false, locked: false, stageKey: '' },
            } as ScriptFloraNode
            return [...current, clone]
          })
          break
        }
        case 'regenerate': {
          // Use snapshot to avoid stale closure
          setNodes((current) => {
            setEdges((currentEdges) => {
              void regenerateSingleNode(id, current, currentEdges)
              return currentEdges
            })
            return current
          })
          break
        }
      }
    },
    [update, setNodes, setEdges, regenerateSingleNode],
  )

  /* -------------------- full generation (Generate button) -------------------- */

  const handleGenerate = useCallback(async () => {
    // Preflight: need a brief connected to a skill with a selection
    const skillNode = nodes.find((n) => n.type === 'skill')
    const skill = skillNode?.type === 'skill' ? (skillNode.data as { selected: SkillId | null }).selected : null

    if (!skillNode || !skill) {
      setPreflightMessage('Add a Skill node and select Standard or Auteur.')
      setGenerateState('preflight-error')
      return
    }

    const briefNode = nodes.find(
      (n) => n.type === 'brief' && edges.some((e) => e.source === n.id && e.target === skillNode.id),
    )
    if (!briefNode || briefNode.type !== 'brief') {
      setPreflightMessage('Connect a Brief node to the Skill node first.')
      setGenerateState('preflight-error')
      return
    }

    const brief = briefNode.data as BriefNodeData
    if (!brief.title && !brief.objective) {
      setPreflightMessage('Fill in at least a title or objective in the Brief node.')
      setGenerateState('preflight-error')
      return
    }

    setPreflightMessage(undefined)
    setGenerateError(undefined)
    setGenerateState('generating')

    // Mark all skill-connected edges as flowing
    setEdges((current) =>
      current.map((e) =>
        e.source === skillNode.id ? { ...e, data: { flowing: true } } : e,
      ),
    )

    const genId = nanoid(6)
    activeGenId.current = genId

    const existingContent = collectExistingContent(skillNode.id, nodes, edges)
    const req: GenerationRequest = {
      brief,
      skill,
      skillMarkdown: (skillNode.data as { skillMarkdown?: string }).skillMarkdown ?? '',
      existingContent,
      model,
      fast: model === 'gpt-5.5' || model === 'gpt-5.4' ? fastMode : false,
      reasoningEffort: model === 'gpt-4o' ? undefined : reasoningEffort,
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })

      // Stale response guard
      if (activeGenId.current !== genId) return

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        if (res.status === 401) {
          setGenerateError('Sign in with ChatGPT to generate.')
        } else {
          setGenerateError(body.error ?? 'Generation failed.')
        }
        setGenerateState('error')
        setEdges((current) => current.map((e) => ({ ...e, data: { flowing: false } })))
        return
      }

      const plan: GenerationPlan = await res.json()
      if (activeGenId.current !== genId) return

      const { nodes: nextNodes, edges: nextEdges } = reconcile(plan, skillNode, nodes, edges)
      setNodes(nextNodes)
      setEdges(nextEdges.map((e) => ({ ...e, data: { flowing: false } })))
      setGenerateState('idle')
    } catch (err) {
      if (activeGenId.current !== genId) return
      setGenerateError(err instanceof Error ? err.message : 'Generation failed.')
      setGenerateState('error')
      setEdges((current) => current.map((e) => ({ ...e, data: { flowing: false } })))
    }
  }, [nodes, edges, setNodes, setEdges, model, fastMode, reasoningEffort])

  /* -------------------- continuity / output regenerate -------------------- */

  const regenerateNonContent = useCallback(
    (id: string) => {
      update(id, { status: 'generating', progress: 0 })
      let p = 0
      const prog = window.setInterval(() => { p = Math.min(p + 10, 90); update(id, { progress: p }) }, 180)
      timers.current.push(
        window.setTimeout(() => {
          window.clearInterval(prog)
          setNodes((current) =>
            current.map((node) => {
              if (node.id !== id) return node
              if (node.type === 'continuity') {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    status: 'draft',
                    progress: 100,
                    score: 94,
                    checkedAt: 'just now',
                    issues: [],
                  },
                } as ScriptFloraNode
              }
              return { ...node, data: { ...node.data, status: 'draft', progress: 100 } } as ScriptFloraNode
            }),
          )
        }, 1900),
      )
    },
    [update, setNodes],
  )

  // Extend act to handle continuity/output regenerate
  const actExtended = useCallback(
    (id: string, action: NodeAction) => {
      if (action === 'regenerate') {
        const node = nodes.find((n) => n.id === id)
        if (node?.type === 'continuity' || node?.type === 'output') {
          regenerateNonContent(id)
          return
        }
      }
      act(id, action)
    },
    [act, nodes, regenerateNonContent],
  )

  const actions = useMemo(() => ({ update, act: actExtended }), [update, actExtended])

  /* -------------------- graph interactions -------------------- */

  const onConnect: OnConnect = useCallback(
    (connection: Connection) =>
      setEdges((current) => addEdge({ ...connection, type: 'smoothstep' }, current)),
    [setEdges],
  )

  const handlePaneDoubleClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement
    const onPane =
      target.classList.contains('react-flow__pane') ||
      target.classList.contains('react-flow__background')
    if (!onPane) return
    setMenu({ x: event.clientX, y: event.clientY })
  }, [])

  const handleAddNode = useCallback(
    (request: AddNodeRequest) => {
      if (!menu) return
      const position = screenToFlowPosition({ x: menu.x, y: menu.y })
      setNodes((current) => [...current, buildNode(request, position)])
      setMenu(null)
    },
    [menu, screenToFlowPosition, setNodes],
  )

  const addBrief = useCallback(() => {
    setNodes((current) => [...current, buildNode({ type: 'brief' }, { x: 0, y: 0 })])
  }, [setNodes])

  const handleDropNode = useCallback(
    (request: AddNodeRequest, event: React.DragEvent | React.MouseEvent) => {
      const point = 'clientX' in event ? { x: event.clientX, y: event.clientY } : { x: 180, y: 180 }
      const position = screenToFlowPosition(point)
      setNodes((current) => [...current, buildNode(request, position)])
    },
    [screenToFlowPosition, setNodes],
  )

  const handleCanvasDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const raw = event.dataTransfer.getData('application/ScriptFlora-node')
      if (!raw) return
      try {
        handleDropNode(JSON.parse(raw) as AddNodeRequest, event)
      } catch {
        // Ignore malformed drag payloads
      }
    },
    [handleDropNode],
  )

  const styledEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        className: edge.data?.flowing ? 'edge-flowing' : undefined,
        style: edge.data?.flowing
          ? { stroke: 'oklch(0.685 0.152 296 / 52%)', strokeWidth: 1 }
          : undefined,
      })),
    [edges],
  )

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
          onDragOver={(event) => {
            event.preventDefault()
            event.dataTransfer.dropEffect = 'copy'
          }}
          onDrop={handleCanvasDrop}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 0.85 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          selectionOnDrag
          panOnScroll
          zoomOnDoubleClick={false}
          nodesDraggable
          elevateNodesOnSelect
          elevateEdgesOnSelect
        >
          <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="oklch(1 0 0 / 7%)" />
          <MiniMap
            pannable
            zoomable
            ariaLabel="Canvas minimap"
            nodeColor={(node) => MINIMAP_COLOR[node.type ?? ''] ?? '#3a3a3d'}
            nodeStrokeWidth={0}
            nodeBorderRadius={3}
            maskColor="oklch(0.145 0.004 285 / 0.72)"
            style={{
              width: 168,
              height: 112,
              background: 'oklch(0.185 0.005 285 / 0.9)',
              border: '1px solid oklch(1 0 0 / 8%)',
              backdropFilter: 'blur(12px)',
              right: 16,
              bottom: 16,
              margin: 0,
            }}
          />
        </ReactFlow>

        <FloatingSidebar onDropNode={handleDropNode} />

        <TopBar
          projectName={projectName}
          onProjectNameChange={(name) => {
            setProjectName(name)
            updateProject(projectId, { name })
          }}
          nodeCount={nodes.length}
          onGenerate={handleGenerate}
          generateState={generateState}
          generateError={generateError}
          preflightMessage={preflightMessage}
          model={model}
          onModelChange={handleModelChange}
          fastMode={fastMode}
          onFastModeChange={handleFastModeChange}
          reasoningEffort={reasoningEffort}
          onReasoningEffortChange={handleReasoningEffortChange}
        />
        <CanvasControls />

        {nodes.length === 0 && <EmptyState onAddBrief={addBrief} />}

        {menu && (
          <AddNodeMenu
            position={menu}
            onSelect={handleAddNode}
            onClose={() => setMenu(null)}
          />
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
