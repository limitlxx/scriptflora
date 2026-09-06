'use client'

/**
 * Feature P1 — PanelShell
 * The outer wrapper for every dockable/floating panel.
 *
 * Docked mode:   fixed position at dock edge, resizable via drag handle
 * Floating mode: freely draggable, resizable on all sides, z-index managed
 *
 * Drag to detach: drag the panel header more than DETACH_THRESHOLD px
 * Drop near edge: triggers DockZone → parent calls usePanelStore.dock()
 * Right-click header: opens context menu with all panel actions
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronDown, ChevronUp, Columns2, Dock, ExternalLink, GripHorizontal,
  Layers, LocateFixed, RotateCcw, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePanelStore, constrainPosition, type DockSide } from '@/lib/panel-store'
import { DockZoneOverlay } from './dock-zone'

const DETACH_THRESHOLD = 12
const MIN_W = 200
const MIN_H = 160
const EDGE_THRESHOLD = 80

type PanelShellProps = {
  id: string
  title: string
  icon?: ReactNode
  children: ReactNode
  onDockRequest?: (side: DockSide) => void
  className?: string
}

// ── Context menu ──────────────────────────────────────────────────────────────

type MenuItem =
  | { type: 'item'; label: string; icon: React.ComponentType<{ className?: string }>; action: () => void; danger?: boolean }
  | { type: 'separator' }

function ContextMenu({ items, x, y, onClose }: {
  items: MenuItem[]
  x: number
  y: number
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click or Escape
  useEffect(() => {
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    const key  = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [onClose])

  // Clamp to viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth  - 192),
    top:  Math.min(y, window.innerHeight - 400),
    zIndex: 9999,
    width: 180,
  }

  return createPortal(
    <div
      ref={ref}
      style={style}
      role="menu"
      className={cn(
        'flex flex-col overflow-hidden rounded-xl py-1',
        'bg-[oklch(0.16_0.005_285/0.97)] border border-white/[0.12]',
        'shadow-[0_20px_60px_-12px_oklch(0_0_0/0.8)]',
        'backdrop-blur-2xl',
      )}
    >
      {/* scrollable list — max ~8 items before scroll kicks in */}
      <div className="max-h-80 overflow-y-auto scroll-slim">
        {items.map((item, i) =>
          item.type === 'separator'
            ? <div key={i} className="my-1 h-px bg-white/[0.07]" role="separator" />
            : (
              <button
                key={i}
                type="button"
                role="menuitem"
                onClick={() => { item.action(); onClose() }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12px] transition-colors',
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-foreground/80 hover:bg-white/[0.07] hover:text-foreground',
                )}
              >
                <item.icon className="size-3.5 shrink-0 opacity-60" />
                {item.label}
              </button>
            )
        )}
      </div>
    </div>,
    document.body,
  )
}

// ── PanelShell ────────────────────────────────────────────────────────────────

export function PanelShell({ id, title, icon, children, className }: PanelShellProps) {
  const {
    panels, setPosition, setSize, setCollapsed,
    bringToFront, detach, dock, setVisible, resetPosition, resetToDefault, stackAll,
  } = usePanelStore()

  const panel = panels[id]
  if (!panel) return null

  const { mode, dockSide, position, size, collapsed, zIndex, visible } = panel

  // ── Context menu state ────────────────────────────────────────────
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)

  const onHeaderContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }, [])

  // Build menu items based on current mode
  const menuItems = useCallback((): MenuItem[] => {
    const items: MenuItem[] = []

    if (collapsed) {
      items.push({ type: 'item', label: 'Expand', icon: ChevronDown, action: () => setCollapsed(id, false) })
    } else {
      items.push({ type: 'item', label: 'Collapse', icon: ChevronUp, action: () => setCollapsed(id, true) })
    }

    items.push({ type: 'separator' })

    if (mode === 'docked') {
      items.push({ type: 'item', label: 'Detach', icon: ExternalLink, action: () => detach(id) })
      items.push({ type: 'item', label: 'Dock left',   icon: Dock,    action: () => dock(id, 'left') })
      items.push({ type: 'item', label: 'Dock right',  icon: Columns2, action: () => dock(id, 'right') })
    } else {
      items.push({ type: 'item', label: 'Dock left',   icon: Dock,    action: () => dock(id, 'left') })
      items.push({ type: 'item', label: 'Dock right',  icon: Columns2, action: () => dock(id, 'right') })
    }

    items.push({ type: 'separator' })
    items.push({ type: 'item', label: 'Reset position', icon: LocateFixed, action: () => resetPosition(id) })
    items.push({ type: 'item', label: 'Reset to default', icon: RotateCcw, action: () => resetToDefault(id) })
    items.push({ type: 'item', label: 'Stack all panels', icon: Layers, action: () => stackAll() })
    items.push({ type: 'separator' })
    items.push({ type: 'item', label: 'Close panel', icon: X, action: () => setVisible(id, false), danger: true })

    return items
  // ponytail: deps include all actions; recalculates on mode/collapsed change only
  }, [id, mode, collapsed, setCollapsed, detach, dock, resetPosition, resetToDefault, stackAll, setVisible])

  // ── Drag-to-move (floating mode) ─────────────────────────────────
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const dockZoneRef = useRef<DockSide | null>(null)

  const onHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return  // ignore right-click for drag
    if (mode === 'docked') {
      dragRef.current = { startX: e.clientX, startY: e.clientY, origX: position.x, origY: position.y }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } else {
      bringToFront(id)
      dragRef.current = { startX: e.clientX, startY: e.clientY, origX: position.x, origY: position.y }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    }
    e.preventDefault()
  }, [mode, position, id, bringToFront])

  const onHeaderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY

    if (mode === 'docked') {
      if (Math.abs(dx) > DETACH_THRESHOLD || Math.abs(dy) > DETACH_THRESHOLD) {
        detach(id)
        dragRef.current = {
          startX: e.clientX, startY: e.clientY,
          origX: e.clientX - size.width / 2,
          origY: e.clientY - 20,
        }
      }
      return
    }

    const constrained = constrainPosition({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy }, size)
    setPosition(id, constrained)

    const vw = window.innerWidth, vh = window.innerHeight
    if      (e.clientX < EDGE_THRESHOLD)       dockZoneRef.current = 'left'
    else if (e.clientX > vw - EDGE_THRESHOLD)  dockZoneRef.current = 'right'
    else if (e.clientY > vh - EDGE_THRESHOLD)  dockZoneRef.current = 'bottom'
    else                                        dockZoneRef.current = null
  }, [mode, size, id, detach, setPosition])

  const onHeaderPointerUp = useCallback(() => {
    if (dockZoneRef.current && mode === 'floating') dock(id, dockZoneRef.current)
    dockZoneRef.current = null
    dragRef.current = null
  }, [mode, id, dock])

  // ── Resize floating ───────────────────────────────────────────────
  const resizeDragRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null)

  const onResizePointerDown = useCallback((e: React.PointerEvent) => {
    resizeDragRef.current = { startX: e.clientX, startY: e.clientY, origW: size.width, origH: size.height }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault(); e.stopPropagation()
  }, [size])

  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizeDragRef.current) return
    setSize(id, {
      width:  Math.max(MIN_W, resizeDragRef.current.origW + e.clientX - resizeDragRef.current.startX),
      height: Math.max(MIN_H, resizeDragRef.current.origH + e.clientY - resizeDragRef.current.startY),
    })
  }, [id, setSize])

  const onResizePointerUp = useCallback(() => { resizeDragRef.current = null }, [])

  // ── Resize docked ─────────────────────────────────────────────────
  const dockedResizeDragRef = useRef<{ startPos: number; origSize: number } | null>(null)

  const onDockedResizePointerDown = useCallback((e: React.PointerEvent) => {
    const isVertical = dockSide === 'bottom'
    dockedResizeDragRef.current = {
      startPos: isVertical ? e.clientY : e.clientX,
      origSize: isVertical ? size.height : size.width,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault(); e.stopPropagation()
  }, [dockSide, size])

  const onDockedResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dockedResizeDragRef.current) return
    const isVertical = dockSide === 'bottom'
    const delta = dockedResizeDragRef.current.startPos - (isVertical ? e.clientY : e.clientX)
    const newSize = Math.max(
      isVertical ? MIN_H : MIN_W,
      dockedResizeDragRef.current.origSize + (isVertical ? delta : (dockSide === 'right' ? -delta : delta))
    )
    setSize(id, isVertical ? { width: size.width, height: newSize } : { width: newSize, height: size.height })
  }, [id, dockSide, size, setSize])

  const onDockedResizePointerUp = useCallback(() => { dockedResizeDragRef.current = null }, [])

  if (!visible) return null

  // Shared header actions area (same in both modes, different button sets)
  const sharedHeaderEvents = {
    onPointerDown: onHeaderPointerDown,
    onPointerMove: onHeaderPointerMove,
    onPointerUp:   onHeaderPointerUp,
    onContextMenu: onHeaderContextMenu,
  }

  // ── Docked layout ─────────────────────────────────────────────────
  if (mode === 'docked') {
    const isLeft   = dockSide === 'left'
    const isRight  = dockSide === 'right'
    const isBottom = dockSide === 'bottom'

    return (
      <>
        {ctxMenu && <ContextMenu items={menuItems()} x={ctxMenu.x} y={ctxMenu.y} onClose={() => setCtxMenu(null)} />}
        <div
          style={{
            position: 'absolute', zIndex: 20,
            ...(isLeft   && { left: 0,  top: 40, bottom: 0, width:  collapsed ? 40 : size.width }),
            ...(isRight  && { right: 0, top: 40, bottom: 0, width:  collapsed ? 40 : size.width }),
            ...(isBottom && { left: 0,  right: 0, bottom: 0, height: collapsed ? 40 : size.height }),
          }}
          className={cn(
            'flex bg-[oklch(0.145_0.004_285/0.97)] border-white/[0.08] transition-[width,height] duration-200',
            isLeft   && 'flex-col border-r',
            isRight  && 'flex-col border-l',
            isBottom && 'flex-row border-t',
            className,
          )}
          onClick={() => bringToFront(id)}
        >
          <header
            className="flex h-10 shrink-0 cursor-grab items-center gap-2 border-b border-white/[0.06] px-3 select-none active:cursor-grabbing"
            {...sharedHeaderEvents}
          >
            <GripHorizontal className="size-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
            {icon && <span className="shrink-0 text-muted-foreground/70">{icon}</span>}
            {!collapsed && <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-foreground/80">{title}</span>}
            <div className="ml-auto flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              <HeaderBtn icon={collapsed ? ChevronDown : ChevronUp} label={collapsed ? 'Expand' : 'Collapse'} onClick={() => setCollapsed(id, !collapsed)} />
              <HeaderBtn icon={LocateFixed} label="Reset panel" onClick={() => resetToDefault(id)} />
              <HeaderBtn icon={ExternalLink} label="Detach panel" onClick={() => detach(id)} />
            </div>
          </header>

          {!collapsed && (
            <div className="min-h-0 flex-1 overflow-y-auto scroll-slim">{children}</div>
          )}

          {!collapsed && (
            <div
              className={cn(
                'absolute shrink-0 bg-transparent hover:bg-primary/20 transition-colors',
                isLeft   && 'right-0 top-10 bottom-0 w-1 cursor-ew-resize',
                isRight  && 'left-0 top-10 bottom-0 w-1 cursor-ew-resize',
                isBottom && 'top-0 left-0 right-0 h-1 cursor-ns-resize',
              )}
              onPointerDown={onDockedResizePointerDown}
              onPointerMove={onDockedResizePointerMove}
              onPointerUp={onDockedResizePointerUp}
              aria-label="Resize panel"
            />
          )}
        </div>
      </>
    )
  }

  // ── Floating layout (portal) ──────────────────────────────────────
  return createPortal(
    <>
      {ctxMenu && <ContextMenu items={menuItems()} x={ctxMenu.x} y={ctxMenu.y} onClose={() => setCtxMenu(null)} />}
      <DockZoneOverlay activeZone={dockZoneRef.current} visible={dragRef.current !== null && mode === 'floating'} />

      <div
        style={{ position: 'fixed', left: position.x, top: position.y, width: size.width, height: collapsed ? 40 : size.height, zIndex }}
        className={cn(
          'flex flex-col overflow-hidden rounded-xl',
          'bg-[oklch(0.155_0.005_285/0.97)] border border-white/[0.12]',
          'shadow-[0_20px_60px_-16px_oklch(0_0_0/0.7),0_0_0_1px_oklch(1_0_0/0.04)]',
          'backdrop-blur-2xl transition-[height] duration-150',
          className,
        )}
        onClick={() => bringToFront(id)}
      >
        <header
          className="flex h-10 shrink-0 cursor-grab items-center gap-2 border-b border-white/[0.08] px-3 select-none active:cursor-grabbing"
          {...sharedHeaderEvents}
          onDoubleClick={() => dock(id, 'left')}
          title="Drag to move · Right-click for options · Double-click to re-dock"
        >
          <GripHorizontal className="size-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
          {icon && <span className="shrink-0 text-muted-foreground/70">{icon}</span>}
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-foreground/80">{title}</span>
          <div className="ml-auto flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <HeaderBtn icon={collapsed ? ChevronDown : ChevronUp} label={collapsed ? 'Expand' : 'Collapse'} onClick={() => setCollapsed(id, !collapsed)} />
            <HeaderBtn icon={Dock}       label="Dock left"        onClick={() => dock(id, 'left')} />
            <HeaderBtn icon={Columns2}   label="Dock right"       onClick={() => dock(id, 'right')} />
            <HeaderBtn icon={LocateFixed} label="Reset position"  onClick={() => resetPosition(id)} />
            <HeaderBtn icon={Layers}     label="Stack all panels" onClick={() => stackAll()} />
            <HeaderBtn icon={X}          label="Close panel"      onClick={() => setVisible(id, false)} />
          </div>
        </header>

        {!collapsed && (
          <div className="min-h-0 flex-1 overflow-y-auto scroll-slim">{children}</div>
        )}

        {!collapsed && (
          <div
            className="absolute bottom-0 right-0 size-4 cursor-nwse-resize opacity-0 hover:opacity-100"
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            aria-label="Resize panel"
          >
            <svg viewBox="0 0 16 16" className="size-full fill-muted-foreground/30">
              <path d="M12 4 L4 12 M16 8 L8 16 M16 12 L12 16" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </div>
    </>,
    document.body,
  )
}

// ── HeaderBtn ─────────────────────────────────────────────────────────────────

function HeaderBtn({ icon: Icon, label, onClick }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-6 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-white/[0.07] hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
    >
      <Icon className="size-3" />
    </button>
  )
}
