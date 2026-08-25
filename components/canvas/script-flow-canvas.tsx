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
  type BriefNodeData,
  type ContentKind,
  type ContentNodeData,
  type GenerationPlan,
  type GenerationRequest,
  type NodeAction,
  type ScriptFlowEdge,
  type ScriptFlowNode,
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
import { TopBar, type GenerateState, type GenerationSettings } from './top-bar'
import { CanvasControls, type CanvasMode } from './canvas-controls'
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

function buildNode(request: AddNodeRequest, position: { x: number; y: number }): ScriptFlowNode {
  const { type, kind } = request
  switch (type) {
    case 'brief':
      return {
        id: nextId('brief'), type: 'brief', position,
        data: { title: '', objective: '', audience: '', platforms: [], duration: '', tone: 'cinematic', keyFacts: [], additionalNotes: '', status: 'empty' },
      }
    case 'skill':
      return { id: nextId('skill'), type: 'skill', position, data: { selected: null } }
    case 'continuity':
      return { id: nextId('continuity'), type: 'continuity', position, data: { status: 'empty', score: 0, checkedAt: null, issues: [] } }
    case 'output':
      return {
        id: nextId('output'), type: 'output', position,
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
      return { id: nextId('export'), type: 'export', position, data: { status: 'empty', format: 'md', includeNotes: false, filename: 'untitled-script' } }
    case 'content':
    default: {
      const contentKind: ContentKind = kind ?? 'scene'
      return {
        id: nextId('content'), type: 'content', position,
        data: { kind: contentKind, label: CONTENT_KIND_META[contentKind].label, content: '', prompt: '', progress: 0, status: 'empty', tokens: 0, stageKey: '' },
      }
    }
  }
}

function collectExistingContent(skillNodeId: string, allNodes: ScriptFlowNode[], allEdges: ScriptFlowEdge[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const node of allNodes) {
    if (node.type !== 'content') continue
    if (!allEdges.some((e) => e.source === skillNodeId && e.target === node.id)) continue
    const d = node.data as ContentNodeData
    if ((d.locked || d.approved) && d.stageKey) result[d.stageKey] = d.content
  }
  return result
}

function reconcile(plan: GenerationPlan, skillNode: ScriptFlowNode, allNodes: ScriptFlowNode[], allEdges: ScriptFlowEdge[]): { nodes: ScriptFlowNode[]; edges: ScriptFlowEdge[] } {
  const existing = allNodes.filter((n) => n.type === 'content' && allEdges.some((e) => e.source === skillNode.id && e.target === n.id))
  const existingByKey = new Map(existing.filter((n) => (n.data as ContentNodeData).stageKey).map((n) => [(n.data as ContentNodeData).stageKey!, n]))

  const newNodes: ScriptFlowNode[] = []

  for (const [i, stage] of plan.stages.entries()) {
    const match = existingByKey.get(stage.stageKey)
    if (match) {
      const d = match.data as ContentNodeData
      if (d.locked || d.approved) continue
      ;(match.data as ContentNodeData).content = stage.content
      ;(match.data as ContentNodeData).status = 'draft'
      ;(match.data as ContentNodeData).label = stage.label
    } else {
      const col = Math.floor(i / 6)
      const row = i % 6
      newNodes.push({
        id: nextId('content'), type: 'content',
        position: { x: skillNode.position.x + 420 + col * 380, y: skillNode.position.y - 100 + row * 230 },
        data: { kind: stage.kind as ContentKind, label: stage.label, content: stage.content, status: 'draft', stageKey: stage.stageKey, index: stage.index, tokens: Math.round(stage.content.length * 1.4), progress: 100 },
      })
    }
  }

  const nodes = [...allNodes, ...newNodes]
  const allContentIds = new Set([...existing.map((n) => n.id), ...newNodes.map((n) => n.id)])
  const keptEdges = allEdges.filter((e) => !(e.source === skillNode.id && allContentIds.has(e.target)))
  const newEdges: ScriptFlowEdge[] = [...existing.map((n) => n.id), ...newNodes.map((n) => n.id)].map((targetId) => ({
    id: `${skillNode.id}->${targetId}`,
    source: skillNode.id,
    target: targetId,
    type: 'smoothstep' as const,
    animated: false,
    data: { flowing: false },
  }))

  return { nodes, edges: [...keptEdges, ...newEdges] }
}

function Flow({ projectId }: { projectId: string }) {
  const saved = loadProjectGraph(projectId)
  const [nodes, setNodes, onNodesChange] = useNodesState<ScriptFlowNode>((saved?.nodes as ScriptFlowNode[] | undefined) ?? [])
  const [edges, setEdges, onEdgesChange] = useEdgesState<ScriptFlowEdge>((saved?.edges as ScriptFlowEdge[] | undefined) ?? [])

  const [projectName, setProjectName] = useState(() => {
    if (typeof window === 'undefined') return 'Untitled project'
    try {
      const list = JSON.parse(localStorage.getItem('sf:projects') ?? '[]') as Array<{ id: string; name: string }>
      return list.find((p) => p.id === projectId)?.name ?? 'Untitled project'
    } catch { return 'Untitled project' }
  })

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('pointer')
  const [showHelp, setShowHelp] = useState(false)
  const [generateState, setGenerateState] = useState<GenerateState>('idle')
  const [generateError, setGenerateError] = useState<string | undefined>()
  const [preflightMessage, setPreflightMessage] = useState<string | undefined>()

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
    ;(window as unknown as Record<string, unknown>).__scriptflowNodes = nodes
    saveProjectGraph(projectId, nodes, edges)
    updateProject(projectId, { nodeCount: nodes.filter((n) => n.type === 'content').length })
  }, [nodes, edges, projectId])

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

      // Delete / Backspace — delete selected nodes (locked nodes are skipped)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
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
    setNodes((cur) => cur.map((n) => n.id === id ? ({ ...n, data: { ...n.data, ...patch } } as ScriptFlowNode) : n))
  }, [setNodes])

  // Single-node regenerate via API
  const regenerateSingleNode = useCallback(async (id: string, allNodes: ScriptFlowNode[], allEdges: ScriptFlowEdge[]) => {
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
    const req: GenerationRequest = {
      brief: { ...brief, additionalNotes: `${brief.additionalNotes ?? ''}\n\nRegenerate only: "${d.label}" (stageKey: ${d.stageKey ?? d.kind}).`.trim() },
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
          return [...c, { ...src, id: nextId(src.type ?? 'node'), position: { x: src.position.x + 40, y: src.position.y + 40 }, selected: false, data: { ...src.data, approved: false, locked: false, stageKey: '' } } as ScriptFlowNode]
        })
        break
      case 'regenerate':
        setNodes((cur) => { setEdges((curE) => { void regenerateSingleNode(id, cur, curE); return curE }); return cur })
        break
    }
  }, [update, setNodes, setEdges, regenerateSingleNode])

  // Ref so actExtended can call handleGenerate without a circular dep
  const handleGenerateRef = useRef<() => Promise<void>>()

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
            if (n.type === 'continuity') return { ...n, data: { ...n.data, status: 'draft', progress: 100, score: 94, checkedAt: 'just now', issues: [] } } as ScriptFlowNode
            return { ...n, data: { ...n.data, status: 'draft', progress: 100 } } as ScriptFlowNode
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
      setPreflightMessage('Add a Skill node and select Standard or Auteur.')
      setGenerateState('preflight-error')
      return
    }
    const briefNode = nodes.find((n) => n.type === 'brief' && edges.some((e) => e.source === n.id && e.target === skillNode.id))
    if (!briefNode || briefNode.type !== 'brief') {
      setPreflightMessage('Connect a Brief node to the Skill node first.')
      setGenerateState('preflight-error')
      return
    }
    const brief = briefNode.data as BriefNodeData
    if (!brief.title && !brief.objective) {
      setPreflightMessage('Fill in at least a title or objective in the Brief.')
      setGenerateState('preflight-error')
      return
    }

    setPreflightMessage(undefined)
    setGenerateError(undefined)
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

      if (activeGenId.current !== genId) return

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        setGenerateError(res.status === 401 ? 'Sign in with ChatGPT to generate.' : (body.error ?? 'Generation failed.'))
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
    } catch (err) {
      if (activeGenId.current !== genId) return
      setGenerateError(err instanceof Error ? err.message : 'Generation failed.')
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

  const handleAddNode = useCallback((request: AddNodeRequest) => {
    if (!menu) return
    setNodes((c) => [...c, buildNode(request, screenToFlowPosition({ x: menu.x, y: menu.y }))])
    setMenu(null)
  }, [menu, screenToFlowPosition, setNodes])

  const addBrief = useCallback(() => setNodes((c) => [...c, buildNode({ type: 'brief' }, { x: 0, y: 0 })]), [setNodes])

  const handleDropNode = useCallback((request: AddNodeRequest, event: React.DragEvent | React.MouseEvent) => {
    const point = 'clientX' in event ? { x: event.clientX, y: event.clientY } : { x: 180, y: 180 }
    setNodes((c) => [...c, buildNode(request, screenToFlowPosition(point))])
  }, [screenToFlowPosition, setNodes])

  const handleCanvasDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const raw = event.dataTransfer.getData('application/scriptflow-node')
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
        <ReactFlow<ScriptFlowNode, ScriptFlowEdge>
          nodes={nodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDoubleClick={handlePaneDoubleClick}
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

        <FloatingSidebar onDropNode={handleDropNode} />

        <TopBar
          projectName={projectName}
          onProjectNameChange={(name) => { setProjectName(name); updateProject(projectId, { name }) }}
          nodeCount={nodes.length}
          onGenerate={handleGenerate}
          generateState={generateState}
          generateError={generateError}
          preflightMessage={preflightMessage}
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
        <CanvasControls mode={canvasMode} onModeChange={setCanvasMode} onShowHelp={() => setShowHelp(true)} />

        {nodes.length === 0 && <EmptyState onAddBrief={addBrief} />}
        {menu && <AddNodeMenu position={menu} onSelect={handleAddNode} onClose={() => setMenu(null)} />}

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
                  ['Delete / ⌫', 'Delete selected nodes (locked nodes are skipped)'],
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

export function ScriptFlowCanvas({ projectId }: { projectId: string }) {
  return (
    <ReactFlowProvider>
      <Flow projectId={projectId} />
    </ReactFlowProvider>
  )
}
