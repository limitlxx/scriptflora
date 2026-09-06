'use client'

/**
 * Feature P1 — Nodes Library panel.
 * The node drag-to-canvas library as a proper panel (formerly embedded in FloatingSidebar).
 * Can dock left (default) or detach to float.
 */

import {
  ArrowDownToLine, BookMarked, BookOpen, Clapperboard, FileText,
  Film, Flag, Gauge, Globe, Grid2X2, Image, Layers, MessageCircle,
  Package, Play, ScanLine, Scissors, Share2, ShieldCheck,
  Sparkles, Target, Tv, Users, Video, WandSparkles, Zap,
} from 'lucide-react'
import { type DragEvent, type MouseEvent } from 'react'
import { cn } from '@/lib/utils'
import { usePanelStore } from '@/lib/panel-store'
import { PanelShell } from './panel-shell'
import type { AddNodeRequest } from '@/components/canvas/add-node-menu'

type NodeItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  request: AddNodeRequest
}
type NodeGroup = { heading: string; items: NodeItem[] }

const NODE_GROUPS: NodeGroup[] = [
  {
    heading: 'Setup',
    items: [
      { label: 'Brief',         icon: FileText, request: { type: 'brief' as const } },
      { label: 'Skill Selector',icon: Layers,   request: { type: 'skill' as const } },
    ],
  },
  {
    heading: 'Continuity',
    items: [
      { label: 'Character Bible',    icon: Users,       request: { type: 'character-bible' as const } },
      { label: 'World / Style Lock', icon: Globe,       request: { type: 'style-lock' as const } },
      { label: 'Continuity Log',     icon: BookMarked,  request: { type: 'continuity-log' as const } },
      { label: 'Continuity Checker', icon: ShieldCheck, request: { type: 'continuity' as const } },
    ],
  },
  {
    heading: 'Script stages',
    items: [
      { label: 'Hook',                 icon: Zap,          request: { type: 'content' as const, kind: 'hook' as const } },
      { label: 'Scene',                icon: ScanLine,     request: { type: 'content' as const, kind: 'scene' as const } },
      { label: 'Dialogue / Narration', icon: MessageCircle,request: { type: 'content' as const, kind: 'dialogue' as const } },
      { label: 'Visual Directions',    icon: WandSparkles, request: { type: 'content' as const, kind: 'visual' as const } },
      { label: 'CTA',                  icon: Target,       request: { type: 'content' as const, kind: 'cta' as const } },
    ],
  },
  {
    heading: 'Shot layer',
    items: [
      { label: 'Shot List',        icon: Clapperboard, request: { type: 'shot-list' as const } },
      { label: 'Storyboard Frame', icon: Image,        request: { type: 'storyboard' as const } },
      { label: 'Sequence',         icon: Film,         request: { type: 'sequence' as const } },
    ],
  },
  {
    heading: 'Media generation',
    items: [
      { label: 'Generate Shot', icon: Play,  request: { type: 'generate-shot' as const } },
      { label: 'Result',        icon: Video, request: { type: 'result' as const } },
      { label: 'Checkpoint',    icon: Flag,  request: { type: 'checkpoint' as const } },
    ],
  },
  {
    heading: 'Assembly & export',
    items: [
      { label: 'Timeline',           icon: Scissors,        request: { type: 'timeline' as const } },
      { label: 'Export Package',     icon: Package,         request: { type: 'export-package' as const } },
      { label: 'Multi-Format Output',icon: Grid2X2,         request: { type: 'output' as const } },
      { label: 'Export',             icon: ArrowDownToLine, request: { type: 'export' as const } },
    ],
  },
  {
    heading: 'Autopilot',
    items: [
      { label: 'Batch Planner',       icon: Sparkles, request: { type: 'batch-planner' as const } },
      { label: 'Autopilot Dashboard', icon: Gauge,    request: { type: 'autopilot-dashboard' as const } },
    ],
  },
  {
    heading: 'Series memory',
    items: [
      { label: 'Episode Memory', icon: BookOpen, request: { type: 'episode-memory' as const } },
      { label: 'Series Arc',     icon: Tv,       request: { type: 'series-arc' as const } },
    ],
  },
  {
    heading: 'Packs & team',
    items: [
      { label: 'Project Pack',    icon: Clapperboard, request: { type: 'project-pack' as const } },
      { label: 'Social Variants', icon: Share2,       request: { type: 'social-variants' as const } },
      { label: 'Team Workspace',  icon: Users,        request: { type: 'team-workspace' as const } },
    ],
  },
]

type Props = {
  onDropNode: (request: AddNodeRequest, event: DragEvent | MouseEvent) => void
  projectId: string
}

export function NodesLibraryPanel({ onDropNode, projectId: _projectId }: Props) {
  const { panels, setVisible } = usePanelStore()
  const panel = panels['nodes-library']

  if (!panel?.visible) return null

  const startDrag = (e: DragEvent<HTMLButtonElement>, request: AddNodeRequest) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/ScriptFlora-node', JSON.stringify(request))
  }

  return (
    <PanelShell
      id="nodes-library"
      title="Nodes"
      icon={<Layers className="size-3.5" />}
    >
      <div className="space-y-0.5 p-1.5">
        {NODE_GROUPS.map((group) => (
          <NodeGroup
            key={group.heading}
            group={group}
            startDrag={startDrag}
            onDropNode={onDropNode}
          />
        ))}
      </div>
    </PanelShell>
  )
}

function NodeGroup({
  group, startDrag, onDropNode,
}: {
  group: NodeGroup
  startDrag: (e: DragEvent<HTMLButtonElement>, r: AddNodeRequest) => void
  onDropNode: (r: AddNodeRequest, e: DragEvent | MouseEvent) => void
}) {
  return (
    <div>
      <div className="px-2.5 py-1.5">
        <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/55">
          {group.heading}
        </span>
      </div>
      <div className="mb-1 ml-2 flex flex-col gap-0.5 border-l border-white/[0.06] pl-2">
        {group.items.map(({ label, icon: Icon, request }) => (
          <button
            key={label}
            type="button"
            draggable
            onDragStart={(e) => startDrag(e, request)}
            onClick={(e) => onDropNode(request, e)}
            title="Drag to canvas"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <Icon className="size-3.5 shrink-0 text-muted-foreground/70" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
