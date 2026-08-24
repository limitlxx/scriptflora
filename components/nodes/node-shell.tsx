'use client'

import { Handle, Position } from '@xyflow/react'
import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { STATUS_META, type NodeStatus } from '@/lib/flow-types'

/* ------------------------------------------------------------------ */
/* Status dot                                                          */
/* ------------------------------------------------------------------ */

export function StatusDot({
  status,
  className,
}: {
  status: NodeStatus
  className?: string
}) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn('flex items-center gap-1.5', className)}
      title={meta.label}
    >
      <span className="relative flex size-1.5">
        {status === 'generating' && (
          <span className="bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-60" />
        )}
        <span
          className={cn(
            'relative inline-flex size-1.5 rounded-full',
            meta.tone === 'neutral' && 'bg-muted-foreground/50',
            meta.tone === 'accent' && 'bg-primary',
            meta.tone === 'success' && 'bg-success',
            meta.tone === 'danger' && 'bg-destructive',
          )}
        />
      </span>
      <span
        className={cn(
          'text-[10px] font-medium tracking-wide',
          meta.tone === 'success'
            ? 'text-success'
            : meta.tone === 'danger'
              ? 'text-destructive'
              : meta.tone === 'accent'
                ? 'text-primary'
                : 'text-muted-foreground',
        )}
      >
        {meta.label}
      </span>
      <span className="sr-only">status</span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Hover / selection toolbar                                           */
/* ------------------------------------------------------------------ */

export function NodeToolbar({
  visible,
  children,
}: {
  visible: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'absolute -top-3 left-1/2 z-20 -translate-x-1/2 -translate-y-full',
        'transition-all duration-200 ease-out',
        visible
          ? 'pointer-events-auto translate-y-[-100%] opacity-100'
          : 'pointer-events-none translate-y-[calc(-100%+6px)] opacity-0',
      )}
    >
      <div className="bg-popover/95 shadow-float flex items-center gap-0.5 rounded-xl border border-white/10 p-1 backdrop-blur-xl">
        {children}
      </div>
    </div>
  )
}

export function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
  tone = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  tone?: 'default' | 'accent' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'nodrag flex size-7 items-center justify-center rounded-lg transition-colors duration-150',
        'text-muted-foreground hover:text-foreground hover:bg-white/[0.07]',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-35',
        active &&
          tone === 'accent' &&
          'bg-accent-muted text-primary hover:text-primary',
        active && tone === 'default' && 'bg-white/[0.09] text-foreground',
        tone === 'danger' && 'hover:text-destructive hover:bg-destructive/10',
      )}
    >
      <Icon className="size-3.5" />
    </button>
  )
}

export function ToolbarDivider() {
  return <span className="mx-0.5 h-4 w-px bg-white/10" />
}

/* ------------------------------------------------------------------ */
/* Node shell                                                          */
/* ------------------------------------------------------------------ */

export type NodeShellProps = {
  selected?: boolean
  locked?: boolean
  approved?: boolean
  status?: NodeStatus
  /** Width in px — nodes are fixed-width for a tidy graph. */
  width?: number
  toolbar?: ReactNode
  toolbarVisible?: boolean
  hasTarget?: boolean
  hasSource?: boolean
  children: ReactNode
  className?: string
}

export function NodeShell({
  selected,
  locked,
  approved,
  status,
  width = 320,
  toolbar,
  toolbarVisible,
  hasTarget = true,
  hasSource = true,
  children,
  className,
}: NodeShellProps) {
  return (
    <div className="group/node relative" style={{ width }}>
      {hasTarget && <Handle type="target" position={Position.Left} />}
      {hasSource && <Handle type="source" position={Position.Right} />}

      {toolbar && (
        <NodeToolbar visible={Boolean(toolbarVisible ?? selected)}>
          {toolbar}
        </NodeToolbar>
      )}

      <div
        className={cn(
          'bg-card relative rounded-2xl border transition-all duration-300 ease-out',
          selected
            ? 'border-primary/30 shadow-[0_0_0_1px_oklch(0.685_0.152_296/14%),0_10px_30px_-18px_oklch(0.685_0.152_296/45%)]'
            : 'shadow-node border-white/[0.06] hover:border-white/[0.11]',
          locked && 'opacity-65 saturate-[0.55]',
          status === 'error' && !selected && 'border-destructive/35',
          approved && !selected && 'border-success/25',
          className,
        )}
      >
        {/* generating shimmer along the top edge */}
        {status === 'generating' && (
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden rounded-t-2xl">
            <span className="via-primary absolute inset-y-0 w-1/2 animate-[edge-flow_1.4s_linear_infinite] bg-gradient-to-r from-transparent to-transparent" />
          </span>
        )}

        {locked && (
          <span
            className="bg-elevated absolute -top-1.5 -right-1.5 z-10 flex size-5 items-center justify-center rounded-full border border-white/10"
            title="Locked"
          >
            <Lock className="text-muted-foreground size-2.5" />
            <span className="sr-only">Locked</span>
          </span>
        )}

        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export function NodeHeader({
  icon: Icon,
  title,
  subtitle,
  right,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className="bg-elevated flex size-6 shrink-0 items-center justify-center rounded-md border border-white/[0.06]">
            <Icon className="text-muted-foreground size-3" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-foreground truncate text-[13px] leading-tight font-medium tracking-[-0.01em]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-muted-foreground mt-0.5 truncate text-[10.5px] leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right && <div className="shrink-0 pt-0.5">{right}</div>}
    </header>
  )
}

export function NodeDivider() {
  return <div className="h-px bg-white/[0.06]" />
}

export function NodeFooter({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <footer
      className={cn(
        'text-muted-foreground flex items-center justify-between gap-2 px-4 py-2.5 text-[10px]',
        className,
      )}
    >
      {children}
    </footer>
  )
}

/* ------------------------------------------------------------------ */
/* Field primitives (used by form-style nodes)                         */
/* ------------------------------------------------------------------ */

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-muted-foreground mb-1.5 block text-[10px] font-medium tracking-[0.06em] uppercase">
      {children}
    </span>
  )
}

export const fieldClass = cn(
  'nodrag w-full rounded-lg border border-white/[0.08] bg-black/25 px-2.5 py-2',
  'text-[12px] leading-relaxed text-foreground placeholder:text-muted-foreground/55',
  'transition-colors duration-150 outline-none',
  'hover:border-white/[0.13] focus:border-primary/45 focus:bg-black/35',
  'disabled:cursor-not-allowed disabled:opacity-60',
)
