'use client'

import dynamic from 'next/dynamic'

// ssr:false must live in a Client Component.
// The canvas file exports ScriptFloraCanvas — use that exact name.
const CanvasLazy = dynamic(
  () => import('./script-flow-canvas').then((m) => ({ default: m.ScriptFloraCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh w-full items-center justify-center bg-[oklch(0.112_0.003_285)]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-white/10 border-t-[oklch(0.685_0.152_296)]" />
          <p className="text-[12px] text-[oklch(0.62_0.008_285)]">Loading canvas…</p>
        </div>
      </div>
    ),
  },
)

// Export under both names so canvas page works regardless
export const ScriptFloraCanvas = CanvasLazy
export const ScriptFlowCanvas = CanvasLazy
