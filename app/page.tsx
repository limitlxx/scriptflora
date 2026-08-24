import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/logo'
import { AuthButton } from '@/components/auth-button'

export default function LandingPage() {
  return (
    <div className="bg-canvas relative flex min-h-dvh flex-col overflow-hidden">
      {/* faint dot field */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'radial-gradient(oklch(1 0 0 / 8%) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
      {/* soft violet wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[880px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-[0.16] blur-[130px]"
        style={{ background: 'oklch(0.685 0.152 296)' }}
      />

      <header className="relative z-10 flex h-12 items-center justify-between px-5">
        <Logo />
        <nav className="flex items-center gap-5">
          <Link
            href="/canvas"
            className="text-muted-foreground hover:text-foreground text-[12.5px] transition-colors duration-150"
          >
            Canvas
          </Link>
          <span className="text-muted-foreground/70 hidden text-[12.5px] sm:inline">
            Docs
          </span>
        </nav>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24">
        <span className="text-muted-foreground mb-7 flex items-center gap-2 rounded-full border border-white/[0.08] px-3 py-1 text-[11px] tracking-[0.01em]">
          <span className="bg-primary size-1.5 rounded-full" />
          Now in private beta
        </span>

        <h1 className="max-w-[19ch] text-balance text-center text-[clamp(2.25rem,6.5vw,4rem)] leading-[1.04] font-medium tracking-[-0.035em]">
          <span className="text-gradient">Structured scripts.</span>
          <br />
          <span className="text-gradient">Continuity guaranteed.</span>
        </h1>

        <p className="text-muted-foreground mt-6 max-w-[46ch] text-center text-[14.5px] leading-relaxed text-pretty">
          Node-based AI scriptwriting. Bring your own ChatGPT subscription.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          {/* AuthButton handles LWC when secret is set, falls back to direct link */}
          <AuthButton />
          <p className="text-muted-foreground/60 text-[11px]">
            No new subscription. Your key, your models.
          </p>
        </div>

        <div className="mt-16 grid max-w-2xl grid-cols-3 gap-4 text-center">
          {[
            { label: 'Connect brief', desc: 'Fill in topic, audience, key facts' },
            { label: 'Choose a skill', desc: 'Standard or Auteur pipeline' },
            { label: 'Generate & edit', desc: 'Lock, regenerate, export' },
          ].map((step, i) => (
            <div
              key={step.label}
              className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
            >
              <span className="text-primary mb-2 block font-mono text-[10px]">
                0{i + 1}
              </span>
              <p className="text-foreground/90 mb-1 text-[12.5px] font-medium">
                {step.label}
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 flex items-center justify-between px-5 pb-5">
        <span className="text-muted-foreground/50 text-[11px]">ScriptFlora</span>
        <span className="text-muted-foreground/50 text-[11px]">
          Built for writers&apos; rooms
        </span>
      </footer>
    </div>
  )
}
