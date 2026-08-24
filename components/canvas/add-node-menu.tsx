'use client'

import {
  ArrowDownToLine,
  Camera,
  FileText,
  LayoutGrid,
  Layers,
  MessageSquare,
  Milestone,
  ShieldCheck,
  Sparkle,
  Target,
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
