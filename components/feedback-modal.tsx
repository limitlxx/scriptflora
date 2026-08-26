'use client'

/**
 * Feedback modal — appears after DELAY_MS of cumulative app use.
 * Dismissed state is persisted to localStorage so it doesn't reappear
 * for SNOOZE_DAYS days.
 */
import { useEffect, useState } from 'react'
import { ExternalLink, Heart, MessageSquare, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DELAY_MS = 3 * 60 * 1000   // 3 minutes
const SNOOZE_DAYS = 7
const LS_KEY = 'sf:feedback-dismissed'

const GOOGLE_FORM_URL = 'https://forms.gle/8ndVEG9BmM3yuzE3A'
const LINKEDIN_URL =
  'https://www.linkedin.com/posts/emmanuel-ojo-4a4b44229_10alyticsbusiness-albuildfest2026-activity-7498378847076241409-RiWe'

function wasDismissedRecently(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return false
    const ts = Number(raw)
    return Date.now() - ts < SNOOZE_DAYS * 86_400_000
  } catch {
    return false
  }
}

function dismiss() {
  try {
    localStorage.setItem(LS_KEY, String(Date.now()))
  } catch { /* ignore */ }
}

export function FeedbackModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (wasDismissedRecently()) return
    const timer = window.setTimeout(() => setOpen(true), DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    dismiss()
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-end p-4 sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Feedback"
    >
      {/* Backdrop — soft, doesn't block the canvas */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={handleDismiss}
        aria-hidden
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-4 rounded-2xl border border-white/[0.1] bg-[oklch(0.16_0.005_285)] p-6 shadow-2xl duration-300">
        {/* Close */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/[0.07] hover:text-foreground transition-colors"
        >
          <X className="size-3.5" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Heart className="size-5" />
        </div>

        {/* Copy */}
        <h2 className="mb-1.5 text-[15px] font-medium text-foreground">
          Enjoying ScriptFlow?
        </h2>
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          You've been scripting for a while — we'd love to hear what you think.
          Takes less than 2 minutes.
        </p>

        {/* CTAs */}
        <div className="mt-5 flex flex-col gap-2.5">
          <a
            href={GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDismiss}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5',
              'text-[13px] font-medium text-primary-foreground hover:opacity-90 transition-opacity',
            )}
          >
            <MessageSquare className="size-3.5" />
            Share feedback
            <ExternalLink className="size-3 opacity-60" />
          </a>

          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDismiss}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] px-4 py-2.5',
              'text-[13px] font-medium text-foreground/85 hover:bg-white/[0.06] transition-colors',
            )}
          >
            {/* LinkedIn blue "in" mark */}
            <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            View on LinkedIn
            <ExternalLink className="size-3 opacity-60" />
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-center text-[11.5px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
