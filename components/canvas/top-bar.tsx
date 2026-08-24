'use client'

import { Check, ChevronDown, Cloud, Loader2, LogOut, Settings, Sparkles, User, AlertCircle, Settings2, Brain, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'
import { useLoginWithChatGPT } from '@opencoredev/loginwithchatgpt-react'

export type GenerateState = 'idle' | 'preflight-error' | 'generating' | 'error'

export function TopBar({
  projectName,
  onProjectNameChange,
  nodeCount,
  onGenerate,
  generateState,
  generateError,
  preflightMessage,
  model,
  onModelChange,
  fastMode,
  onFastModeChange,
  reasoningEffort,
  onReasoningEffortChange,
}: {
  projectName: string
  onProjectNameChange: (name: string) => void
  nodeCount: number
  onGenerate: () => void
  generateState: GenerateState
  generateError?: string
  preflightMessage?: string
  model: string
  onModelChange: (model: string) => void
  fastMode: boolean
  onFastModeChange: (val: boolean) => void
  reasoningEffort: 'low' | 'medium' | 'high'
  onReasoningEffortChange: (val: 'low' | 'medium' | 'high') => void
}) {
  const auth = useLoginWithChatGPT()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen && !settingsOpen) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (menuOpen && !menuRef.current?.contains(target)) setMenuOpen(false)
      if (settingsOpen && !settingsRef.current?.contains(target)) setSettingsOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen, settingsOpen])

  const busy = generateState === 'generating'
  const hasError = generateState === 'preflight-error' || generateState === 'error'
  const errorMsg = preflightMessage ?? generateError

  const supportsFast = model === 'gpt-5.5' || model === 'gpt-5.4'
  const supportsReasoning = model === 'gpt-5.5' || model === 'gpt-5.4' || model === 'gpt-5.4-mini'

  return (
    <header className="pointer-events-auto absolute inset-x-0 top-0 z-30 flex h-10 items-center justify-between gap-4 border-b border-white/[0.05] bg-[oklch(0.145_0.004_285/0.66)] px-3 backdrop-blur-xl">
      {/* left — logo + project */}
      <div className="flex min-w-0 items-center gap-3">
        <Logo className="shrink-0" />
        <span className="h-4 w-px bg-white/[0.09]" />
        <input
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          aria-label="Project name"
          className={cn(
            'text-foreground/90 min-w-0 max-w-[220px] truncate rounded-md bg-transparent px-1.5 py-1',
            'text-[12.5px] font-medium tracking-[-0.01em] outline-none',
            'hover:bg-white/[0.05] focus:bg-white/[0.06] transition-colors duration-150',
          )}
        />
        <span className="text-muted-foreground/70 hidden items-center gap-1 text-[10.5px] sm:flex">
          <Cloud className="size-3" />
          Saved
        </span>
      </div>

      {/* centre — generate button */}
      <div className="flex items-center gap-2">
        {hasError && errorMsg && (
          <span className="hidden items-center gap-1.5 text-[10.5px] text-destructive sm:flex" role="alert">
            <AlertCircle className="size-3 shrink-0" />
            {errorMsg}
          </span>
        )}
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
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {busy ? 'Generating…' : hasError ? 'Retry' : 'Generate'}
        </button>

        {/* AI Engine Settings */}
        <div className="relative flex items-center" ref={settingsRef}>
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            aria-label="AI Engine Settings"
            className={cn(
              'flex h-7 px-2 items-center justify-center gap-1 rounded-lg border border-white/[0.07] bg-black/20 text-muted-foreground transition-all duration-150 text-[11px]',
              'hover:bg-white/[0.06] hover:text-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              settingsOpen && 'bg-white/[0.06] text-foreground border-white/[0.15]',
            )}
          >
            <Settings2 className={cn('size-3', busy && 'animate-spin')} />
            <span>AI Settings</span>
          </button>

          {settingsOpen && (
            <div
              className="bg-popover/95 shadow-float absolute left-1/2 top-full mt-2 w-64 -translate-x-1/2 origin-top animate-in fade-in-0 zoom-in-95 rounded-xl border border-white/10 p-3.5 backdrop-blur-xl duration-150 z-40"
            >
              {/* Model */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10.5px] font-medium tracking-[0.06em] uppercase">Model</span>
                  <span className="text-[10px] text-primary bg-primary/10 rounded px-1.5 py-0.5 font-mono">{model}</span>
                </div>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'gpt-5.5', name: 'GPT-5.5', desc: 'Advanced reasoning' },
                    { id: 'gpt-5.4', name: 'GPT-5.4', desc: 'Standard reasoning' },
                    { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', desc: 'Fast reasoning' },
                    { id: 'gpt-4o', name: 'GPT-4o', desc: 'High speed' },
                  ].map((m) => {
                    const active = model === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onModelChange(m.id)}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-2 py-1 text-left transition-colors duration-150',
                          active
                            ? 'bg-primary/15 text-primary'
                            : 'text-foreground/80 hover:bg-white/[0.05] hover:text-foreground',
                        )}
                      >
                        <div>
                          <span className="block text-[11px] font-medium leading-tight">{m.name}</span>
                          <span className="block text-[9px] text-muted-foreground/80 leading-none mt-0.5">{m.desc}</span>
                        </div>
                        {active && <Check className="size-3 text-primary" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="my-2 h-px bg-white/[0.06]" />

              {/* Fast Mode */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Zap className="size-3 text-warning" />
                    <span className="text-[11px] font-medium text-foreground">Fast Mode</span>
                  </div>
                  <span className="mt-0.5 block text-[9px] leading-snug text-muted-foreground/75">
                    Bypasses queues for instant responses. Consumes quota faster.
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={fastMode}
                  disabled={!supportsFast}
                  onClick={() => onFastModeChange(!fastMode)}
                  className={cn(
                    'relative h-4.5 w-8 shrink-0 rounded-full transition-colors duration-200 mt-1',
                    fastMode && supportsFast ? 'bg-primary' : 'bg-white/[0.12]',
                    (!supportsFast) && 'opacity-35 cursor-not-allowed',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-3.5 rounded-full bg-white transition-all duration-200 ease-out',
                      fastMode && supportsFast ? 'left-[14px]' : 'left-0.5',
                    )}
                  />
                </button>
              </div>

              <div className="my-2 h-px bg-white/[0.06]" />

              {/* Reasoning Effort */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Brain className="size-3 text-primary" />
                    <span className="text-[11px] font-medium text-foreground">Thinking Effort</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground capitalize">{reasoningEffort}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/25 p-0.5 border border-white/[0.04]">
                  {(['low', 'medium', 'high'] as const).map((level) => {
                    const active = reasoningEffort === level
                    const disabled = !supportsReasoning
                    return (
                      <button
                        key={level}
                        type="button"
                        disabled={disabled}
                        onClick={() => onReasoningEffortChange(level)}
                        className={cn(
                          'rounded-md py-0.5 text-center text-[10px] font-medium transition-all duration-150 capitalize',
                          active && !disabled
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                          disabled && 'opacity-35 cursor-not-allowed',
                        )}
                      >
                        {level}
                      </button>
                    )
                  })}
                </div>
                <span className="block text-[9px] leading-snug text-muted-foreground/75">
                  Controls budget and depth allocated for reasoning stage.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* right — meta + user */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/70 hidden font-mono text-[10.5px] md:inline">
          {nodeCount} nodes
        </span>
        <span className="hidden h-4 w-px bg-white/[0.09] md:block" />
        <span className="text-muted-foreground hidden items-center gap-1.5 rounded-md border border-white/[0.07] px-2 py-1 text-[10.5px] sm:flex">
          <span className="bg-success size-1.5 rounded-full" />
          ChatGPT connected
        </span>

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
            <ChevronDown
              className={cn(
                'text-muted-foreground size-3 transition-transform duration-200',
                menuOpen && 'rotate-180',
              )}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="bg-popover/95 shadow-float absolute right-0 top-full mt-1.5 w-56 origin-top-right animate-in fade-in-0 zoom-in-95 rounded-xl border border-white/10 p-1 backdrop-blur-xl duration-150 z-40"
            >
              <div className="border-b border-white/[0.06] px-2.5 py-2">
                <p className="text-foreground text-[12px] font-medium truncate">
                  {auth.user?.email || 'ScriptFlora User'}
                </p>
                <p className="text-muted-foreground truncate text-[10.5px]">via ChatGPT subscription</p>
              </div>
              <div className="py-1">
                {[
                  { icon: User, label: 'Account' },
                  { icon: Settings, label: 'Preferences' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    className="text-foreground/85 hover:text-foreground flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors duration-150 hover:bg-white/[0.06]"
                  >
                    <item.icon className="text-muted-foreground size-3.5" />
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-white/[0.06] px-2.5 py-2">
                <p className="text-muted-foreground/70 mb-1 text-[10px] tracking-[0.06em] uppercase">Engine</p>
                <div className="text-foreground/85 flex items-center justify-between text-[11.5px]">
                  <span className="font-mono text-primary text-[10.5px]">{model}</span>
                  <Check className="text-success size-3" />
                </div>
              </div>
              <div className="border-t border-white/[0.06] pt-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    await auth.logout()
                    window.location.href = '/'
                  }}
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
