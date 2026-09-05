import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, BookMarked, Sparkles } from 'lucide-react'
import { Logo } from '@/components/logo'
import { TeamLibraryClient } from '@/components/skills-studio/team-library-client'

export const metadata: Metadata = {
  title: 'Skill Library — ScriptFlora',
  description: 'Browse, install, and manage team skill pipelines.',
}

export default function SkillLibraryPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-white/[0.06] bg-background/80 px-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-white/20">/</span>
          <Link href="/skills" className="flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-3.5" />
            Skills Studio
          </Link>
          <span className="text-white/20">/</span>
          <span className="flex items-center gap-1.5 text-[12px] text-foreground/80">
            <BookMarked className="size-3.5" />
            Team Library
          </span>
        </div>
        <Link href="/skills" className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground">
          <Sparkles className="size-3" />
          Studio
        </Link>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-10 md:px-10">
        <div className="mb-8">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-primary/80">Team Library</p>
          <h1 className="text-2xl font-medium tracking-tight md:text-3xl">Installed skills</h1>
          <p className="mt-3 max-w-prose text-[13.5px] leading-7 text-muted-foreground">
            Browse, install, and manage skills available to this workspace.
            Import a skill JSON file shared by a team member, or export your own.
            Built-in skills are always available and cannot be uninstalled.
          </p>
        </div>
        <TeamLibraryClient />
      </div>
    </div>
  )
}
