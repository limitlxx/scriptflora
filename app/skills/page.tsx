import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, BookMarked, BookOpen, Sparkles } from 'lucide-react'
import { Logo } from '@/components/logo'
import { SkillListClient } from '@/components/skills-studio/skill-list-client'

export const metadata: Metadata = {
  title: 'Skills Studio — ScriptFlora',
  description: 'Create, version, and test Director skill pipelines.',
}

export default function SkillsPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-white/[0.06] bg-background/80 px-5 backdrop-blur-xl md:px-10">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-white/20">/</span>
          <Link href="/projects" className="flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
          <span className="text-white/20">/</span>
          <span className="flex items-center gap-1.5 text-[12px] text-foreground/80">
            <Sparkles className="size-3.5" />
            Skills Studio
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/skills/library" className="flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary/25">
            <BookMarked className="size-3" />
            Library
          </Link>
          <Link href="/docs#skills" className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground">
            <BookOpen className="size-3" />
            Docs
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-10 md:px-10">
        {/* Hero */}
        <div className="mb-8">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-primary/80">
            Skills Studio
          </p>
          <h1 className="text-2xl font-medium tracking-tight md:text-3xl">
            Director skill pipelines
          </h1>
          <p className="mt-3 max-w-prose text-[13.5px] leading-7 text-muted-foreground">
            Create reusable Director pipelines — script structures, style packs, training templates.
            Test them in isolation before installing. Versions are immutable once published.
          </p>

          {/* Skill families */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ['Script',    'Scenes, dialogue, macro-states'],
              ['Style',     'Visual rules + style packs'],
              ['Structure', 'Beat/act templates'],
              ['Packaging', 'HyperFrames defaults'],
              ['Domain',    'Training, theater, demos'],
            ].map(([family, desc]) => (
              <div key={family} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
                <p className="text-[11px] font-medium text-primary">{family}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Skill list — client component handles localStorage */}
        <SkillListClient />
      </div>
    </div>
  )
}
