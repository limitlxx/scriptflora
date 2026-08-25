'use client'

import { useAuth } from '@/components/auth-context'
import { useEffect } from 'react'
import { ArrowRight, Copy, Check, Loader2, RefreshCw, FolderKanban } from 'lucide-react'
import { openLoginWithChatGPTConsentPopup } from '@opencoredev/loginwithchatgpt-react'
import { OpenAiMark } from '@/components/openai-mark'
import { cn } from '@/lib/utils'

export function AuthButton() {
  const auth = useAuth()

  // Auto-redirect after login completes.
  // Use window.location (hard nav) not router.replace (soft nav) so middleware
  // re-runs with the newly set lwc_session cookie — soft nav uses cached middleware result.
  useEffect(() => {
    if (auth.status === 'authenticated') {
      window.location.href = '/projects'
    }
  }, [auth.status])

  if (auth.status === 'loading') {
    return (
      <div className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[13px] text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Checking session…
      </div>
    )
  }

  // Already authenticated — auto-redirect is in flight, but show a manual button
  // in case the router is slow (e.g. middleware re-check delay)
  if (auth.status === 'authenticated') {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => { window.location.href = '/projects' }}
          className="group flex items-center gap-2.5 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <FolderKanban className="size-4" />
          Open app
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
        <p className="text-[11px] text-muted-foreground/60">
          You&apos;re signed in
        </p>
      </div>
    )
  }

  // Device-code pending — show the code
  if (auth.status === 'pending') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.08] bg-black/20 px-5 py-4 text-center">
        <p className="text-[12px] text-muted-foreground">
          Enter this code in the window that opened
        </p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xl font-semibold tracking-[0.18em] text-foreground">
            {auth.userCode}
          </span>
          <button
            type="button"
            onClick={() => void auth.copyCode()}
            aria-label="Copy code"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
          >
            {auth.copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          </button>
        </div>
        <button
          type="button"
          onClick={auth.reopen}
          className="flex items-center gap-1.5 text-[11px] text-primary hover:underline"
        >
          <RefreshCw className="size-3" />
          Reopen sign-in window
        </button>
      </div>
    )
  }

  // Unauthenticated / error
  const handleLogin = () => {
    const popup = openLoginWithChatGPTConsentPopup({
      appName: 'ScriptFlow',
      login: auth.login,
    })
    if (!popup) void auth.login()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleLogin}
        disabled={auth.isConnecting}
        className={cn(
          'group focus-visible:ring-ring flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[13px] font-medium',
          'transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-offset-[oklch(0.145_0.004_285)] focus-visible:outline-none',
          'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 disabled:pointer-events-none',
        )}
      >
        {auth.isConnecting ? <Loader2 className="size-4 animate-spin" /> : <OpenAiMark className="size-4" />}
        {auth.isConnecting ? 'Connecting…' : 'Continue with ChatGPT'}
        {!auth.isConnecting && (
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        )}
      </button>
      {auth.status === 'error' && (
        <p role="alert" className="text-[11px] text-destructive">
          Something went wrong. Try again.
        </p>
      )}
    </div>
  )
}
