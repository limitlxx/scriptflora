'use client'

/**
 * Feature P1 — Detachable Panel System store.
 *
 * Persists panel layout to localStorage under 'sf:panel-layout'.
 * Uses the same localStorage + CustomEvent pattern as lib/store.ts —
 * no Zustand dependency needed.
 *
 * Usage:
 *   const { panels, setMode, detach, dock } = usePanelStore()
 */

import { useCallback, useEffect, useState } from 'react'

export type DockSide = 'left' | 'right' | 'bottom'
export type PanelMode = 'docked' | 'floating'

export type PanelLayout = {
  id: string
  mode: PanelMode
  dockSide: DockSide
  position: { x: number; y: number }
  size: { width: number; height: number }
  collapsed: boolean
  zIndex: number
  visible: boolean
}

export type PanelId = 'nodes-library' | 'inspector' | 'coach' | 'assets'

const LS_KEY = 'sf:panel-layout'
let zCounter = 200

const DEFAULTS: Record<PanelId, PanelLayout> = {
  'nodes-library': {
    id: 'nodes-library',
    mode: 'docked',
    dockSide: 'left',
    position: { x: 16, y: 80 },
    size: { width: 260, height: 600 },
    collapsed: false,
    zIndex: 100,
    visible: true,
  },
  inspector: {
    id: 'inspector',
    mode: 'docked',
    dockSide: 'right',
    position: { x: 900, y: 80 },
    size: { width: 300, height: 500 },
    collapsed: false,
    zIndex: 100,
    visible: false,
  },
  coach: {
    id: 'coach',
    mode: 'docked',
    dockSide: 'right',
    position: { x: 900, y: 80 },
    size: { width: 340, height: 560 },
    collapsed: false,
    zIndex: 100,
    visible: false,
  },
  assets: {
    id: 'assets',
    mode: 'floating',
    dockSide: 'left',
    position: { x: 100, y: 100 },
    size: { width: 320, height: 480 },
    collapsed: false,
    zIndex: 100,
    visible: false,
  },
}

// ── Persistence helpers ─────────────────────────────────────────────

function readPanels(): Record<string, PanelLayout> {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Record<string, PanelLayout>
    // Back-fill new panels that aren't in stored state
    return { ...DEFAULTS, ...raw }
  } catch {
    return { ...DEFAULTS }
  }
}

function writePanels(panels: Record<string, PanelLayout>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY, JSON.stringify(panels))
  window.dispatchEvent(new CustomEvent('sf:panels:change'))
}

function mutatePanels(id: string, patch: Partial<PanelLayout>) {
  const panels = readPanels()
  if (!panels[id]) return
  const next = { ...panels, [id]: { ...panels[id], ...patch } }
  writePanels(next)
  return next
}

// ── Singleton action functions (call outside React too) ─────────────

export const panelActions = {
  setMode:      (id: string, mode: PanelMode)                    => mutatePanels(id, { mode }),
  setDockSide:  (id: string, dockSide: DockSide)                 => mutatePanels(id, { dockSide }),
  setPosition:  (id: string, position: { x: number; y: number }) => mutatePanels(id, { position }),
  setSize:      (id: string, size: { width: number; height: number }) => mutatePanels(id, { size }),
  setCollapsed: (id: string, collapsed: boolean)                 => mutatePanels(id, { collapsed }),
  setVisible:   (id: string, visible: boolean)                   => mutatePanels(id, { visible }),

  bringToFront: (id: string) => {
    zCounter += 1
    mutatePanels(id, { zIndex: zCounter })
  },

  detach: (id: string) => {
    const panels = readPanels()
    const panel = panels[id]
    if (!panel) return
    const vw = typeof window !== 'undefined' ? window.innerWidth  : 1200
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    let x = 80, y = 80
    if (panel.dockSide === 'right')  x = vw - panel.size.width - 80
    if (panel.dockSide === 'bottom') { x = 80; y = vh - panel.size.height - 80 }
    zCounter += 1
    mutatePanels(id, { mode: 'floating', position: { x, y }, zIndex: zCounter })
  },

  dock: (id: string, side: DockSide) =>
    mutatePanels(id, { mode: 'docked', dockSide: side }),

  resetToDefault: (id: string) => {
    const def = DEFAULTS[id as PanelId]
    if (def) mutatePanels(id, { ...def })
  },

  resetPosition: (id: string) => {
    const def = DEFAULTS[id as PanelId]
    if (def) mutatePanels(id, { position: def.position })
  },

  /** Stack all floating panels with a cascade offset so they're all visible */
  stackAll: () => {
    const panels = readPanels()
    const OFFSET = 28
    let i = 0
    const next = { ...panels }
    for (const [panelId, p] of Object.entries(next)) {
      if (p.mode === 'floating' && p.visible) {
        zCounter += 1
        next[panelId] = { ...p, position: { x: 60 + i * OFFSET, y: 80 + i * OFFSET }, zIndex: zCounter }
        i++
      }
    }
    writePanels(next)
    return next
  },
}

// ── React hook ──────────────────────────────────────────────────────

export function usePanelStore() {
  const [panels, setPanels] = useState<Record<string, PanelLayout>>(readPanels)

  useEffect(() => {
    const sync = () => setPanels(readPanels())
    window.addEventListener('sf:panels:change', sync)
    return () => window.removeEventListener('sf:panels:change', sync)
  }, [])

  // Wrap actions so they also trigger local state update immediately
  const wrap = useCallback(<T extends unknown[]>(fn: (...args: T) => void) =>
    (...args: T) => { fn(...args); setPanels(readPanels()) }
  , [])

  return {
    panels,
    setMode:      wrap(panelActions.setMode),
    setDockSide:  wrap(panelActions.setDockSide),
    setPosition:  wrap(panelActions.setPosition),
    setSize:      wrap(panelActions.setSize),
    setCollapsed: wrap(panelActions.setCollapsed),
    setVisible:   wrap(panelActions.setVisible),
    bringToFront: wrap(panelActions.bringToFront),
    detach:       wrap(panelActions.detach),
    dock:         wrap(panelActions.dock),
    resetToDefault: wrap(panelActions.resetToDefault),
    resetPosition:  wrap(panelActions.resetPosition),
    stackAll:       wrap(panelActions.stackAll),
  }
}

// ── Viewport constraint helper ──────────────────────────────────────

export function constrainPosition(
  pos: { x: number; y: number },
  size: { width: number; height: number },
  margin = 24,
): { x: number; y: number } {
  if (typeof window === 'undefined') return pos
  const maxX = window.innerWidth  - size.width  - margin
  const maxY = window.innerHeight - size.height - margin
  return {
    x: Math.max(margin, Math.min(pos.x, maxX)),
    y: Math.max(margin + 40, Math.min(pos.y, maxY)),
  }
}
