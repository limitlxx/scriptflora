import type { Metadata } from 'next'
import { ProjectsDashboard } from '@/components/projects/projects-dashboard'

export const metadata: Metadata = {
  title: 'Projects — ScriptFlora',
  description: 'Manage your ScriptFlora projects and previous results.',
}

export default function ProjectsPage() {
  return <ProjectsDashboard />
}
