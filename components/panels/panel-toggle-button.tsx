'use client'

/**
 * Feature P1 — Small toggle button to show/hide a panel.
 * Used in the canvas top bar.
 */

import { cn } from '@/lib/utils'
import { usePanelStore } from '@/lib/panel-store'

type Props = {
  panelId: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

export function PanelToggleButton({ panelId, icon: Icon, label }: Props) {
  const { panels, setVisible, bringToFront } = usePanelStore()
  const panel = panels[panelId]
  const visible = panel?.visible ?? false

  const toggle = () => {
    if (visible) {
      setVisible(panelId, false)
    } else {
      setVisible(panelId, true)
      bringToFront(panelId)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={visible}
      aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
      title={`${visible ? 'Hide' : 'Show'} ${label}`}
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition-all duration-150',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        visible
          ? 'border-primary/45 bg-accent-muted text-primary'
          : 'border-white/[0.07] text-muted-foreground hover:text-foreground hover:border-white/[0.14]',
      )}
    >
      <Icon className="size-3" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
