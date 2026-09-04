'use client'

import {
  ArrowDownToLine,
  BookMarked,
  BookOpen,
  Camera,
  Clapperboard,
  FileText,
  Film,
  Flag,
  Gauge,
  Globe,
  Image,
  LayoutGrid,
  Layers,
  MessageSquare,
  Milestone,
  Package,
  Play,
  Scissors,
  Share2,
  ShieldCheck,
  Sparkle,
  Sparkles,
  Target,
  Tv,
  Users,
  Video,
  WandSparkles,
  Eye,
  Zap,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { ContentKind, ScriptFloraNodeType } from '@/lib/flow-types'

export type AddNodeRequest = {
  type: ScriptFloraNodeType
  kind?: ContentKind
  skillId?: string       // for imported skills
  skillMarkdown?: string // full markdown of an imported skill
}

type MenuItem = AddNodeRequest & {
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const GROUPS: { heading: string; items: MenuItem[] }[] = [
  {
    heading: 'Setup',
    items: [
      { label: 'Brief', icon: FileText, type: 'brief' },
      { label: 'Skill selector', icon: Layers, type: 'skill' },
    ],
  },
  {
    heading: 'Continuity core',
    items: [
      { label: 'Character Bible', icon: Users, type: 'character-bible' },
      { label: 'World / Style Lock', icon: Globe, type: 'style-lock' },
      { label: 'Continuity Log', icon: BookMarked, type: 'continuity-log' },
    ],
  },
  {
    heading: 'Standard Script',
    items: [
      { label: 'Hook', icon: Zap, type: 'content', kind: 'hook' },
      { label: 'Scene', icon: Milestone, type: 'content', kind: 'scene' },
      { label: 'Dialogue', icon: MessageSquare, type: 'content', kind: 'dialogue' },
      { label: 'Visual directions', icon: Camera, type: 'content', kind: 'visual' },
      { label: 'Call to action', icon: Target, type: 'content', kind: 'cta' },
    ],
  },
  {
    heading: 'Auteur Script',
    items: [
      { label: 'Stageplay', icon: MessageSquare, type: 'content', kind: 'auteur-stageplay' },
      { label: 'Screenplay', icon: Sparkle, type: 'content', kind: 'auteur-screenplay' },
      { label: 'Technical Screenplay', icon: Milestone, type: 'content', kind: 'auteur-technical' },
      { label: 'Production Summary', icon: Eye, type: 'content', kind: 'auteur-production-summary' },
      { label: 'Auteur Script', icon: WandSparkles, type: 'content', kind: 'auteur-script' },
    ],
  },
  {
    heading: 'Shot layer',
    items: [
      { label: 'Shot List', icon: Clapperboard, type: 'shot-list' },
      { label: 'Storyboard Frame', icon: Image, type: 'storyboard' },
      { label: 'Sequence', icon: Film, type: 'sequence' },
    ],
  },
  {
    heading: 'Media generation',
    items: [
      { label: 'Generate Shot', icon: Play, type: 'generate-shot' },
      { label: 'Result', icon: Video, type: 'result' },
      { label: 'Checkpoint', icon: Flag, type: 'checkpoint' },
    ],
  },
  {
    heading: 'Packs, social & team',
    items: [
      { label: 'Project Pack', icon: Clapperboard, type: 'project-pack' },
      { label: 'Social Variants', icon: Share2, type: 'social-variants' },
      { label: 'Team Workspace', icon: Users, type: 'team-workspace' },
    ],
  },
  {
    heading: 'Series memory',
    items: [
      { label: 'Episode Memory', icon: BookOpen, type: 'episode-memory' },
      { label: 'Series Arc', icon: Tv, type: 'series-arc' },
    ],
  },
  {
    heading: 'Autopilot',
    items: [
      { label: 'Batch Planner', icon: Sparkles, type: 'batch-planner' },
      { label: 'Autopilot Dashboard', icon: Gauge, type: 'autopilot-dashboard' },
    ],
  },
  {
    heading: 'Assembly & export',
    items: [
      { label: 'Timeline', icon: Scissors, type: 'timeline' },
      { label: 'HyperFrames', icon: Film, type: 'hyperframes' },
      { label: 'Export Package', icon: Package, type: 'export-package' },
    ],
  },
  {
    heading: 'Review & deliver',
    items: [
      { label: 'Continuity checker', icon: ShieldCheck, type: 'continuity' },
      { label: 'Multi-format output', icon: LayoutGrid, type: 'output' },
      { label: 'Export', icon: ArrowDownToLine, type: 'export' },
    ],
  },
]

export function AddNodeMenu({
  position,
  onSelect,
  onClose,
}: {
  position: { x: number; y: number }
  onSelect: (request: AddNodeRequest) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // keep the menu inside the viewport
  const left = Math.min(position.x, window.innerWidth - 236)
  const top = Math.min(position.y, window.innerHeight - 420)

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Add node"
      style={{ left, top }}
      className="animate-in fade-in-0 zoom-in-95 shadow-float fixed z-40 w-56 rounded-xl border border-white/10 bg-[oklch(0.216_0.006_285/0.95)] p-1 backdrop-blur-xl duration-150"
    >
      {GROUPS.map((group, gi) => (
        <div
          key={group.heading}
          className={cn(gi > 0 && 'mt-1 border-t border-white/[0.06] pt-1')}
        >
          <p className="text-muted-foreground/70 px-2.5 py-1.5 text-[10px] font-medium tracking-[0.06em] uppercase">
            {group.heading}
          </p>
          {group.items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => onSelect({ type: item.type, kind: item.kind })}
              className={cn(
                'text-foreground/85 hover:text-foreground flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5',
                'text-[12px] transition-colors duration-150 hover:bg-white/[0.07]',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              )}
            >
              <item.icon className="text-muted-foreground size-3.5 shrink-0" />
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
