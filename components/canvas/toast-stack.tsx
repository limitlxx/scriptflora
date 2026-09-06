'use client'

/**
 * ToastStack — renders active toasts in a portal above the canvas.
 * Listens to the sf:toast event bus from lib/toast.ts.
 */

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Toast, TOAST_EVENT } from '@/lib/toast'

const KIND = {
  info: {
    icon: Info,
    bar: 'bg-blue-500',
    bg: 'bg-[oklch(0.18_0.01_240/0.97)] border-blue-500/25',
    title: 'text-blue-200',
    msg: 'text-blue-200/70',
    btn: 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25',
    close: 'text-blue-300/50 hover:text-blue-200',
  },
  success: {
    icon: CheckCircle2,
    bar: 'bg-emerald-500',
    bg: 'bg-[oklch(0.18_0.01_160/0.97)] border-emerald-500/25',
    title: 'text-emerald-200',
    msg: 'text-emerald-200/70',
    btn: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25',
    close: 'text-emerald-300/50 hover:text-emerald-200',
  },
  warning: {
    icon: TriangleAlert,
    bar: 'bg-amber-400',
    bg: 'bg-[oklch(0.18_0.02_80/0.97)] border-amber-400/25',
    title: 'text-amber-200',
    msg: 'text-amber-200/70',
    btn: 'bg-amber-400/15 text-amber-300 hover:bg-amber-400/25',
    close: 'text-amber-300/50 hover:text-amber-200',
  },
  error: {
    icon: AlertCircle,
    bar: 'bg-red-500',
    bg: 'bg-[oklch(0.18_0.02_20/0.97)] border-red-500/25',
    title: 'text-red-200',
    msg: 'text-red-200/70',
    btn: 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
    close: 'text-red-300/50 hover:text-red-200',
  },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const k = KIND[toast.kind]
  const Icon = k.icon

  useEffect(() => {
    const duration = toast.duration ?? 6000
    if (duration === 0) return
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [toast.duration, onDismiss])

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'relative flex w-full max-w-sm overflow-hidden rounded-xl border shadow-[0_8px_32px_-8px_oklch(0_0_0/0.6)]',
        'backdrop-blur-xl animate-in slide-in-from-right-4 fade-in-0 duration-200',
        k.bg,
      )}
    >
      {/* left colour bar */}
      <div className={cn('w-1 shrink-0', k.bar)} />

      <div className="flex min-w-0 flex-1 gap-3 p-3.5">
        <Icon className={cn('mt-0.5 size-4 shrink-0', k.title)} />

        <div className="min-w-0 flex-1">
          <p className={cn('text-[13px] font-medium leading-snug', k.title)}>
            {toast.title}
          </p>
          {toast.message && (
            <p className={cn('mt-0.5 text-[12px] leading-relaxed', k.msg)}>
              {toast.message}
            </p>
          )}
          {toast.action && (
            <button
              type="button"
              onClick={() => { toast.action!.onClick(); onDismiss() }}
              className={cn(
                'mt-2 rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-colors',
                k.btn,
              )}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={cn('shrink-0 transition-colors', k.close)}
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

export function ToastStack() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const payload = (e as CustomEvent).detail as { type: 'add'; toast: Toast } | { type: 'remove'; id: string }
      if (payload.type === 'add') {
        setToasts((prev) => {
          // Deduplicate by title to avoid spam
          const exists = prev.some((t) => t.title === payload.toast.title && t.kind === payload.toast.kind)
          if (exists) return prev
          return [...prev, payload.toast]
        })
      } else {
        setToasts((prev) => prev.filter((t) => t.id !== payload.id))
      }
    }
    window.addEventListener(TOAST_EVENT, handler)
    return () => window.removeEventListener(TOAST_EVENT, handler)
  }, [])

  if (toasts.length === 0) return null

  return createPortal(
    <div
      className="pointer-events-none fixed right-4 top-14 z-[9998] flex flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={() => remove(t.id)} />
        </div>
      ))}
    </div>,
    document.body,
  )
}
