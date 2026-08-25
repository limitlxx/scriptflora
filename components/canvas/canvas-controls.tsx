'use client'

import { useReactFlow, useStore } from '@xyflow/react'
import { Maximize2, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

function ControlButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-lg',
        'transition-colors duration-150 hover:bg-white/[0.07]',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      <Icon className="size-3.5" />
    </button>
  )
}

// ─── 1. Controls at bottom-center ───────────────────────────────────────────
export function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const zoom = useStore((s) => s.transform[2])

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 -translate-x-1/2 flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[oklch(0.201_0.005_285/0.85)] p-1 shadow-float backdrop-blur-xl">
      <ControlButton icon={Minus} label="Zoom out" onClick={() => zoomOut({ duration: 200 })} />
      <span className="text-muted-foreground w-9 text-center font-mono text-[10.5px] tabular-nums select-none">
        {Math.round(zoom * 100)}%
      </span>
      <ControlButton icon={Plus} label="Zoom in" onClick={() => zoomIn({ duration: 200 })} />
      <span className="mx-0.5 h-4 w-px bg-white/[0.09]" />
      <ControlButton icon={Maximize2} label="Fit view" onClick={() => fitView({ duration: 350, padding: 0.18 })} />
    </div>
  )
}
