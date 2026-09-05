import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, BookMarked, ShieldCheck, Store } from 'lucide-react'
import { Logo } from '@/components/logo'
import { MarketplaceClient } from '@/components/marketplace/marketplace-client'

export const metadata: Metadata = {
  title: 'Skills Marketplace — ScriptFlora',
  description: 'Discover and install Director skill pipelines from official and community publishers.',
}

export default function MarketplacePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-white/[0.06] bg-background/80 px-5 backdrop-blur-xl md:px-10">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-white/20">/</span>
          <Link href="/skills" className="flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-3.5" />
            Studio
          </Link>
          <span className="text-white/20">/</span>
          <span className="flex items-center gap-1.5 text-[12px] text-foreground/80">
            <Store className="size-3.5" />
            Marketplace
          </span>
        </div>
        <Link href="/skills/library" className="flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary/25">
          <BookMarked className="size-3" />
          My library
        </Link>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10 md:px-10">
        {/* Hero */}
        <div className="mb-8">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-primary/80">
            Skills Marketplace
          </p>
          <h1 className="text-2xl font-medium tracking-tight md:text-3xl">
            Director skill pipelines
          </h1>
          <p className="mt-3 max-w-prose text-[13.5px] leading-7 text-muted-foreground">
            Discover, install, and manage skill pipelines built by ScriptFlora and the community.
            Each skill has a trust tier and declared permissions — review before installing.
          </p>

          {/* Trust tier legend */}
          <div className="mt-5 flex flex-wrap gap-3">
            {[
              { icon: ShieldCheck, label: 'Official', desc: 'ScriptFlora first-party', color: 'text-primary' },
              { icon: ShieldCheck, label: 'Verified', desc: 'Reviewed publisher', color: 'text-success' },
              { icon: ShieldCheck, label: 'Community', desc: 'Unreviewed — check permissions', color: 'text-warning' },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div key={label} className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                <Icon className={cn('size-3.5', color)} />
                <span className="text-[12px] font-medium text-foreground/80">{label}</span>
                <span className="text-[10.5px] text-muted-foreground/60">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Marketplace — client component handles fetch + install */}
        <MarketplaceClient />
      </div>
    </div>
  )
}

// cn needed for the trust tier cards above
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
