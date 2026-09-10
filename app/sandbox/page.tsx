import { Suspense } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { SandboxPage } from '@/components/sandbox/sandbox-page-client'

export const metadata = {
  title: 'Try ScriptFlora — Free Demo',
  description: 'Generate a real script from your idea in 60 seconds. No account needed.',
}

export default function Sandbox() {
  return (
    <div className="bg-canvas relative flex min-h-dvh flex-col overflow-hidden">
      {/* dot field */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{ backgroundImage: 'radial-gradient(oklch(1 0 0 / 8%) 1px, transparent 1px)', backgroundSize: '26px 26px' }}
      />
      {/* violet wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[880px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-[0.16] blur-[130px]"
        style={{ background: 'oklch(0.685 0.152 296)' }}
      />

      <header className="relative z-10 flex h-12 items-center justify-between px-5">
        <Logo />
        <Link href="/" className="text-muted-foreground hover:text-foreground text-[12.5px] transition-colors">
          ← Back
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center px-5 py-10">
        <div className="mb-8 text-center">
          <span className="text-muted-foreground mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1 text-[11px] tracking-[0.01em]">
            <span className="bg-primary size-1.5 rounded-full" />
            Free demo — no sign-up required
          </span>
          <h1 className="mt-3 text-[clamp(1.75rem,5vw,2.75rem)] font-medium tracking-[-0.03em]">
            See your script in 60 seconds
          </h1>
          <p className="text-muted-foreground mt-3 max-w-[42ch] text-center text-[13.5px] leading-relaxed">
            Describe your idea. Watch ScriptFlora build a brief, structure it, and generate a full script — right now.
          </p>
        </div>
        <Suspense fallback={null}>
          <SandboxPage />
        </Suspense>
      </main>
    </div>
  )
}
