'use client'

import { useReactFlow, useStore } from '@xyflow/react'
import { HelpCircle, Maximize2, Minus, MousePointer, Move, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

function ControlButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex size-7 items-center justify-center rounded-lg transition-colors duration-150',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        active
          ? 'bg-primary/20 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.07]',
      )}
    >
      <Icon className="size-3.5" />
    </button>
  )
}

export type CanvasMode = 'pointer' | 'select'

export function CanvasControls({
  mode,
  onModeChange,
  onShowHelp,
}: {
  mode: CanvasMode
  onModeChange: (m: CanvasMode) => void
  onShowHelp: () => void
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const zoom = useStore((s) => s.transform[2])

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2 flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[oklch(0.201_0.005_285/0.85)] p-1 shadow-float backdrop-blur-xl">
      {/* Mode toggle */}
      <ControlButton
        icon={MousePointer}
        label="Pointer mode — drag to move nodes"
        active={mode === 'pointer'}
        onClick={() => onModeChange('pointer')}
      />
      <ControlButton
        icon={Move}
        label="Select mode — drag to select multiple nodes (S)"
        active={mode === 'select'}
        onClick={() => onModeChange('select')}
      />

      <span className="mx-0.5 h-4 w-px bg-white/[0.09]" />

      {/* Zoom */}
      <ControlButton icon={Minus} label="Zoom out" onClick={() => zoomOut({ duration: 200 })} />
      <span className="text-muted-foreground w-9 text-center font-mono text-[10.5px] tabular-nums select-none">
        {Math.round(zoom * 100)}%
      </span>
      <ControlButton icon={Plus} label="Zoom in" onClick={() => zoomIn({ duration: 200 })} />

      <span className="mx-0.5 h-4 w-px bg-white/[0.09]" />
      <ControlButton icon={Maximize2} label="Fit view (F)" onClick={() => fitView({ duration: 350, padding: 0.18 })} />

      <span className="mx-0.5 h-4 w-px bg-white/[0.09]" />
      <ControlButton icon={HelpCircle} label="Keyboard shortcuts (?)" onClick={onShowHelp} />
    </div>
  )
}
