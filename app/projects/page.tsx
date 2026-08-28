import type { Metadata } from 'next'
import { ProjectsDashboard } from '@/components/projects/projects-dashboard-client'

export const metadata: Metadata = {
  title: 'Projects — ScriptFlora',
  description: 'Manage your ScriptFlora projects.',
}

export default function ProjectsPage() {
  return <ProjectsDashboard />
}
