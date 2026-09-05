import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Logo } from '@/components/logo'
import { SkillEditorClient } from '@/components/skills-studio/skill-editor-client'

export const metadata: Metadata = {
  title: 'Skill Editor — ScriptFlora Studio',
}

export default async function SkillEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header */}
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
            <Sparkles className="size-3.5" />
            Editor
          </span>
        </div>
      </header>

      <SkillEditorClient skillId={id} />
    </div>
  )
}
