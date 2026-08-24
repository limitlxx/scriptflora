import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { ScriptFloraCanvas } from '@/components/canvas/script-flow-canvas'

export const metadata: Metadata = {
  title: 'Canvas — ScriptFlora',
  description: 'Node-based AI scriptwriting canvas.',
}

export default async function CanvasPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>
}) {
  if (process.env.LWC_SECRET && !(await isAuthenticated())) {
    redirect('/')
  }

  const { project: projectId } = await searchParams

  // No project ID — send back to projects to pick or create one
  if (!projectId) {
    redirect('/projects')
  }

  return (
    <main className="bg-canvas h-dvh w-full overflow-hidden">
      <ScriptFloraCanvas projectId={projectId} />
    </main>
  )
}
