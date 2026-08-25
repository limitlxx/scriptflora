'use client'

import {
  AlertCircle,
  Check,
  ChevronDown,
  Cloud,
  Loader2,
  LogOut,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'

export type GenerateState = 'idle' | 'preflight-error' | 'generating' | 'error'

export type GenerationSettings = {
  model: string
  fast: boolean
  reasoning: 'low' | 'medium' | 'high'
}

const MODELS = ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini'] as const
const SUPPORTS_FAST = new Set(['gpt-5.5', 'gpt-5.4'])

async function logoutFromChatGPT() {
  try {
    await fetch('/api/chatgpt/logout', { method: 'POST' })
  } catch { /* best-effort */ }
}

export function TopBar({
  projectName,
  onProjectNameChange,
  nodeCount,
  onGenerate,
  generateState,
  generateError,
  preflightMessage,
  settings,
  onSettingsChange,
}: {
  projectName: string
  onProjectNameChange: (name: string) => void
  nodeCount: number
  onGenerate: () => void
  generateState: GenerateState
  generateError?: string
  preflightMessage?: string
  settings: GenerationSettings
  onSettingsChange: (s: GenerationSettings) => void
}) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logoutFromChatGPT()
    router.replace('/')
  }

  const busy = generateState === 'generating'
  const hasError = generateState === 'preflight-error' || generateState === 'error'
  const errorMsg = preflightMessage ?? generateError
  const fastSupported = SUPPORTS_FAST.has(settings.model)

  return (
    <header className="pointer-events-auto absolute inset-x-0 top-0 z-30 flex h-10 items-center justify-between gap-2 border-b border-white/[0.05] bg-[oklch(0.145_0.004_285/0.66)] px-3 backdrop-blur-xl">
      {/* left — logo + project name */}
      <div className="flex min-w-0 items-center gap-2">
        <Logo className="shrink-0" />
        <span className="h-4 w-px bg-white/[0.09]" />
        <input
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          aria-label="Project name"
          className={cn(
            'text-foreground/90 min-w-0 max-w-[180px] truncate rounded-md bg-transparent px-1.5 py-1',
            'text-[12.5px] font-medium tracking-[-0.01em] outline-none',
            'hover:bg-white/[0.05] focus:bg-white/[0.06] transition-colors duration-150',
          )}
        />
        <span className="text-muted-foreground/70 hidden items-center gap-1 text-[10.5px] sm:flex">
          <Cloud className="size-3" />
          Saved
        </span>
      </div>

      {/* centre — generation controls */}
      <div className="flex items-center gap-1.5">
        {hasError && errorMsg && (
          <span className="hidden items-center gap-1.5 text-[10.5px] text-destructive sm:flex" role="alert">
            <AlertCircle className="size-3 shrink-0" />
            {errorMsg}
          </span>
        )}

        {/* model picker */}
        <div className="relative">
          <select
            value={settings.model}
            onChange={(e) => {
              const m = e.target.value
              onSettingsChange({ ...settings, model: m, fast: SUPPORTS_FAST.has(m) ? settings.fast : false })
            }}
            aria-label="AI model"
            className={cn(
              'appearance-none rounded-lg border border-white/[0.07] bg-black/25 pl-2.5 pr-6 py-1',
              'text-[11px] text-foreground/85 outline-none cursor-pointer',
              'hover:border-white/[0.14] focus:border-primary/40 transition-colors',
            )}
          >
            {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
        </div>

        {/* fast tier toggle */}
        <button
          type="button"
          disabled={!fastSupported}
          aria-pressed={settings.fast}
          title={fastSupported ? 'Fast tier — uses included usage faster' : 'Fast not available for this model'}
          onClick={() => onSettingsChange({ ...settings, fast: !settings.fast })}
          className={cn(
            'flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-all duration-150',
            'disabled:pointer-events-none disabled:opacity-30',
            settings.fast && fastSupported
              ? 'border-primary/45 bg-accent-muted text-primary'
              : 'border-white/[0.07] text-muted-foreground hover:text-foreground hover:border-white/[0.14]',
          )}
        >
          <Zap className="size-3" />
          Fast
        </button>

        {/* reasoning effort */}
        <div className="flex overflow-hidden rounded-lg border border-white/[0.07]">
          {(['low', 'medium', 'high'] as const).map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={settings.reasoning === level}
              onClick={() => onSettingsChange({ ...settings, reasoning: level })}
              title={`Reasoning: ${level}`}
              className={cn(
                'px-2 py-1 text-[10.5px] transition-colors duration-150',
                settings.reasoning === level
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]',
              )}
            >
              {level === 'medium' ? 'Med' : level[0].toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        {/* generate */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={busy}
          aria-label="Generate script"
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all duration-200',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
            'disabled:pointer-events-none disabled:opacity-60',
            hasError
              ? 'bg-destructive/15 text-destructive hover:bg-destructive/25'
              : 'bg-primary text-primary-foreground hover:opacity-90',
          )}
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          {busy ? 'Generating…' : hasError ? 'Retry' : 'Generate'}
        </button>
      </div>

      {/* right — meta + user menu */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/70 hidden font-mono text-[10.5px] md:inline">
          {nodeCount} nodes
        </span>
        <span className="hidden h-4 w-px bg-white/[0.09] md:block" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={cn(
              'flex items-center gap-1.5 rounded-lg py-1 pr-1.5 pl-1 transition-colors duration-150',
              'hover:bg-white/[0.06] focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              menuOpen && 'bg-white/[0.06]',
            )}
          >
            <span className="bg-primary/25 text-primary flex size-6 items-center justify-center rounded-full text-[10px] font-medium">
              SF
            </span>
            <ChevronDown className={cn('text-muted-foreground size-3 transition-transform duration-200', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="bg-popover/95 shadow-float absolute right-0 top-full mt-1.5 w-56 origin-top-right animate-in fade-in-0 zoom-in-95 rounded-xl border border-white/10 p-1 backdrop-blur-xl duration-150"
            >
              <div className="border-b border-white/[0.06] px-2.5 py-2">
                <p className="text-muted-foreground/70 mb-1 text-[10px] tracking-[0.06em] uppercase">Model</p>
                <div className="text-foreground/85 flex items-center justify-between text-[11.5px]">
                  <span>{settings.model}</span>
                  <Check className="text-success size-3" />
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); router.push('/projects') }}
                  className="text-foreground/85 hover:text-foreground flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors duration-150 hover:bg-white/[0.06]"
                >
                  <Settings className="text-muted-foreground size-3.5" />
                  Projects
                </button>
              </div>

              <div className="border-t border-white/[0.06] pt-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleLogout()}
                  className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors duration-150 hover:bg-white/[0.06]"
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
