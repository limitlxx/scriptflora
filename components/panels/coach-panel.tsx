'use client'

/**
 * C1 — ScriptFlora Coach panel.
 * Wraps in PanelShell (docked right by default, detachable).
 * Chat thread with streaming replies grounded in canvas state + product docs.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, Loader2, RotateCcw, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelShell } from './panel-shell'
import type { CoachState } from '@/lib/coach-state'
import { coachStateToText } from '@/lib/coach-state'

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'user' | 'assistant'

type Message = {
  id: string
  role: Role
  content: string
  pending?: boolean
}

// ── Proactive blocker chips ───────────────────────────────────────────────────

const BLOCKER_LABELS: Record<string, string> = {
  brief_unconfirmed: 'Brief not confirmed — skills are locked',
  character_images_missing_before_video: 'Character images needed before video',
  hyperframes_missing_sequence: 'Add a Sequence before packaging',
  no_runway_credits: 'No Runway credits remaining',
  no_director_credits: 'No Director credits remaining',
  sequence_empty: 'Sequence is empty',
}

const BLOCKER_QUESTIONS: Record<string, string> = {
  brief_unconfirmed: 'Why is the Brief confirm button required?',
  character_images_missing_before_video: 'How do I lock a character image?',
  hyperframes_missing_sequence: 'What do I need before using HyperFrames?',
  no_runway_credits: 'How do I get more Runway credits?',
}

// ── Lightweight markdown renderer ────────────────────────────────────────────
// Handles **bold**, *italic*, `code`, ### headings, and - bullet lists.
// ponytail: no remark/marked dep — coach replies are short and predictable.

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Blank line → spacing
    if (!line.trim()) {
      elements.push(<div key={i} className="h-2" />)
      continue
    }

    // Headings
    const h3 = line.match(/^###\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h1 = line.match(/^#\s+(.+)/)
    if (h1 || h2 || h3) {
      const content = (h1 ?? h2 ?? h3)![1]
      elements.push(
        <p key={i} className="mt-1 mb-0.5 text-[12px] font-semibold text-foreground">
          {inlineMarkdown(content)}
        </p>,
      )
      continue
    }

    // Bullet list
    const bullet = line.match(/^[-*]\s+(.+)/)
    if (bullet) {
      elements.push(
        <div key={i} className="flex gap-1.5 leading-relaxed">
          <span className="mt-1 size-1 shrink-0 rounded-full bg-primary/60" />
          <span>{inlineMarkdown(bullet[1])}</span>
        </div>,
      )
      continue
    }

    // Numbered list
    const numbered = line.match(/^(\d+)\.\s+(.+)/)
    if (numbered) {
      elements.push(
        <div key={i} className="flex gap-1.5 leading-relaxed">
          <span className="shrink-0 font-mono text-[10px] text-primary/70 mt-px">{numbered[1]}.</span>
          <span>{inlineMarkdown(numbered[2])}</span>
        </div>,
      )
      continue
    }

    // Normal paragraph
    elements.push(<p key={i} className="leading-relaxed">{inlineMarkdown(line)}</p>)
  }

  return <div className="space-y-0.5 text-[12px]">{elements}</div>
}

function inlineMarkdown(text: string): React.ReactNode {
  // Split on **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="italic text-foreground/90">{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="rounded bg-white/[0.08] px-1 py-px font-mono text-[11px] text-primary/90">{part.slice(1, -1)}</code>
    return part
  })
}

const STARTERS = [
  'Walk me through the first directed path',
  'Standard vs Auteur skill — which should I use?',
  'How does character locking work?',
  'What does HyperFrames do?',
  'How do I run a continuity check?',
]

// ── Streaming fetch helper ────────────────────────────────────────────────────

async function fetchCoach(
  messages: Array<{ role: Role; content: string }>,
  state: string,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch('/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, state }),
    signal,
  })

  const body = await res.json() as { content?: string; error?: string }
  if (!res.ok) throw new Error(body.error ?? res.statusText)
  return body.content ?? ''
}

// ── Main component ────────────────────────────────────────────────────────────

export function CoachPanel({ coachState }: { coachState: CoachState }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dismissedBlockers, setDismissedBlockers] = useState<Set<string>>(new Set())

  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || streaming) return

    setError(null)
    setInput('')

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: trimmed }
    const assistantId = `a-${Date.now()}`
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', pending: true }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    abortRef.current = new AbortController()

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))

    try {
      const text = await fetchCoach(
        history,
        coachStateToText(coachState),
        abortRef.current.signal,
      )
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: text, pending: false } : m),
      )
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Coach unavailable'
      setError(msg)
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setStreaming(false)
    }
  }, [messages, coachState, streaming])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    void sendMessage(input)
  }, [input, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage(input)
    }
  }, [input, sendMessage])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
    setStreaming(false)
  }, [])

  const activeBlockers = coachState.blockers.filter((b) => !dismissedBlockers.has(b))

  return (
    <PanelShell
      id="coach"
      title="Coach"
      icon={<Bot className="size-3.5" />}
    >
      <div className="flex min-h-0 flex-1 flex-col">

        {/* ── Blocker chips ── */}
        {activeBlockers.length > 0 && (
          <div className="shrink-0 space-y-1 border-b border-white/[0.06] p-2">
            {activeBlockers.map((b) => (
              <div key={b} className="flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5">
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] leading-snug text-amber-300/90">{BLOCKER_LABELS[b] ?? b}</p>
                  {BLOCKER_QUESTIONS[b] && (
                    <button
                      type="button"
                      onClick={() => { void sendMessage(BLOCKER_QUESTIONS[b]) }}
                      className="mt-0.5 text-[10.5px] text-amber-400/70 underline hover:text-amber-300"
                    >
                      Help with this
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedBlockers((s) => new Set([...s, b]))}
                  aria-label="Dismiss"
                  className="shrink-0 text-white/30 hover:text-white/60"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Chat thread ── */}
        <div className="min-h-0 flex-1 overflow-y-auto scroll-slim px-3 py-3">
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 rounded-xl bg-white/[0.03] p-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Bot className="size-3.5 text-primary" />
                </div>
                <p className="text-[12px] leading-relaxed text-foreground/70">
                  I coach you through directed AI film production on this canvas — Brief, locks, skills, shots, and packaging.
                </p>
              </div>
              <p className="px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/50">
                Quick starts
              </p>
              <div className="space-y-1.5">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { void sendMessage(s) }}
                    className="w-full rounded-lg border border-white/[0.07] px-3 py-2 text-left text-[11.5px] text-foreground/65 transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'mb-3',
                msg.role === 'user' ? 'flex justify-end' : 'flex items-start gap-2',
              )}
            >
              {msg.role === 'assistant' && (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 mt-0.5">
                  <Bot className="size-3.5 text-primary/80" />
                </div>
              )}
              <div
                className={cn(
                  'rounded-2xl px-3.5 py-2.5',
                  msg.role === 'user'
                    ? 'max-w-[85%] bg-primary/25 text-foreground text-[12px]'
                    : 'flex-1 bg-white/[0.05] border border-white/[0.06] text-foreground/90',
                )}
              >
                {msg.pending && !msg.content
                  ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span className="text-[11.5px]">Thinking…</span>
                    </div>
                  )
                  : msg.role === 'user'
                    ? <span className="whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                    : <MarkdownText text={msg.content} />
                }
              </div>
            </div>
          ))}

          {error && (
            <div className="mb-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-[11.5px] text-destructive">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <div className="shrink-0 border-t border-white/[0.06] p-2.5">
          {messages.length > 0 && (
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={reset}
                title="Clear chat"
                className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] text-muted-foreground/40 hover:bg-white/[0.04] hover:text-muted-foreground transition-colors"
              >
                <RotateCcw className="size-2.5" />
                Clear
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask Coach…"
              disabled={streaming}
              aria-label="Ask Coach"
              className={cn(
                'min-h-[36px] flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2',
                'text-[12px] text-foreground outline-none placeholder:text-muted-foreground/35',
                'focus:border-primary/35 focus:bg-white/[0.06] disabled:opacity-50 transition-all',
                'scroll-slim',
              )}
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              aria-label="Send message"
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-xl transition-all',
                'bg-primary text-primary-foreground hover:opacity-90 shadow-sm',
                'disabled:pointer-events-none disabled:opacity-30',
              )}
            >
              {streaming
                ? <Loader2 className="size-3.5 animate-spin" />
                : <Send className="size-3.5" />
              }
            </button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground/25">
            Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>
    </PanelShell>
  )
}
