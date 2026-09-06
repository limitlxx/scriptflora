'use client'

/**
 * Feature P1 — DockZone overlay.
 * Shows a semi-transparent highlight on the relevant viewport edge
 * when the user is dragging a panel near it.
 */

import { cn } from '@/lib/utils'
import type { DockSide } from '@/lib/panel-store'

type Props = {
  activeZone: DockSide | null
  visible: boolean
}

export function DockZoneOverlay({ activeZone, visible }: Props) {
  if (!visible || !activeZone) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[999]">
      {/* Left zone */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-20 rounded-r-xl transition-opacity duration-150',
        'bg-primary/20 border-r-2 border-primary/40',
        activeZone === 'left' ? 'opacity-100' : 'opacity-0',
      )}>
        <div className="flex h-full items-center justify-center">
          <span className="rotate-[-90deg] text-[10px] font-medium uppercase tracking-[0.1em] text-primary/70">
            Dock left
          </span>
        </div>
      </div>

      {/* Right zone */}
      <div className={cn(
        'absolute right-0 top-0 bottom-0 w-20 rounded-l-xl transition-opacity duration-150',
        'bg-primary/20 border-l-2 border-primary/40',
        activeZone === 'right' ? 'opacity-100' : 'opacity-0',
      )}>
        <div className="flex h-full items-center justify-center">
          <span className="rotate-90 text-[10px] font-medium uppercase tracking-[0.1em] text-primary/70">
            Dock right
          </span>
        </div>
      </div>

      {/* Bottom zone */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-20 rounded-t-xl transition-opacity duration-150',
        'bg-primary/20 border-t-2 border-primary/40',
        activeZone === 'bottom' ? 'opacity-100' : 'opacity-0',
      )}>
        <div className="flex items-end justify-center pb-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-primary/70">
            Dock bottom
          </span>
        </div>
      </div>
    </div>
  )
}
