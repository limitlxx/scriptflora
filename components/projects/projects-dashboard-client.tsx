'use client'

// ssr:false dynamic import must live in a Client Component.
import dynamic from 'next/dynamic'

const ProjectsDashboard = dynamic(
  () => import('./projects-dashboard').then((m) => ({ default: m.ProjectsDashboard })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-7 animate-spin rounded-full border-2 border-white/10 border-t-[oklch(0.685_0.152_296)]" />
      </div>
    ),
  },
)

export { ProjectsDashboard }
