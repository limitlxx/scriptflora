'use client'

/**
 * Tiny event-bus toast store.
 * No Zustand — just a CustomEvent on window.
 * ponytail: global singleton; safe because toasts are fire-and-forget.
 */

export type ToastKind = 'info' | 'success' | 'warning' | 'error'

export type Toast = {
  id: string
  kind: ToastKind
  title: string
  message?: string
  /** Optional CTA label + callback */
  action?: { label: string; onClick: () => void }
  /** ms before auto-dismiss — default 6000; 0 = sticky */
  duration?: number
}

type ToastPayload = { type: 'add'; toast: Toast } | { type: 'remove'; id: string }

const EVENT = 'sf:toast'

function dispatch(payload: ToastPayload) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENT, { detail: payload }))
}

let _counter = 0
function nextId() { return `t-${++_counter}` }

export const toast = {
  info:    (title: string, opts?: Omit<Toast, 'id' | 'kind' | 'title'>) => dispatch({ type: 'add', toast: { id: nextId(), kind: 'info',    title, ...opts } }),
  success: (title: string, opts?: Omit<Toast, 'id' | 'kind' | 'title'>) => dispatch({ type: 'add', toast: { id: nextId(), kind: 'success', title, ...opts } }),
  warning: (title: string, opts?: Omit<Toast, 'id' | 'kind' | 'title'>) => dispatch({ type: 'add', toast: { id: nextId(), kind: 'warning', title, ...opts } }),
  error:   (title: string, opts?: Omit<Toast, 'id' | 'kind' | 'title'>) => dispatch({ type: 'add', toast: { id: nextId(), kind: 'error',   title, ...opts } }),
  dismiss: (id: string) => dispatch({ type: 'remove', id }),
}

export { EVENT as TOAST_EVENT }
