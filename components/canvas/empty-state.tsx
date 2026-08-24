'use client'

import { FileText, MousePointerClick } from 'lucide-react'

export function EmptyState({ onAddBrief }: { onAddBrief: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 flex flex-col items-center text-center duration-500">
        <span className="text-muted-foreground/40 mb-4 flex size-9 items-center justify-center rounded-xl border border-white/[0.07]">
          <MousePointerClick className="size-4" />
        </span>
        <p className="text-foreground/70 text-[13px] tracking-[-0.01em]">
          Double-click to add a node or start with a Brief
        </p>
        <button
          type="button"
          onClick={onAddBrief}
          className="pointer-events-auto text-primary hover:bg-accent-muted focus-visible:ring-ring mt-3.5 flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[12px] transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
        >
          <FileText className="size-3.5" />
          New Brief
        </button>
      </div>
    </div>
  )
}
