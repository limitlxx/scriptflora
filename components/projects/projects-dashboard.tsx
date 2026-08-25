'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowUpRight,
  FolderKanban,
  LogOut,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjects } from '@/lib/store'
import { Logo } from '@/components/logo'

const ACCENTS = [
  'from-primary/20 to-transparent',
  'from-blue-400/15 to-transparent',
  'from-emerald-400/15 to-transparent',
  'from-rose-400/15 to-transparent',
  'from-amber-400/15 to-transparent',
  'from-violet-400/15 to-transparent',
]

const FORMAT_OPTIONS = ['Short film', 'Brand story', 'Series pilot', 'Social campaign', 'Educational video', 'Advertisement']

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/[0.09] bg-[oklch(0.15_0.005_285)] p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-medium text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 172_800_000) return 'Yesterday'
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ProjectsDashboard() {
  const router = useRouter()
  const { projects, createProject, deleteProject } = useProjects()
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState(FORMAT_OPTIONS[0])
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  )

  const handleCreate = () => {
    if (!name.trim()) return
    const project = createProject(name, type)
    setName('')
    setType(FORMAT_OPTIONS[0])
    setCreateOpen(false)
    router.push(`/canvas?project=${project.id}`)
  }

  const handleOpen = (id: string) => {
    router.push(`/canvas?project=${id}`)
  }

  const handleLogout = async () => {
    try { await fetch('/api/chatgpt/logout', { method: 'POST' }) } catch { /* best-effort */ }
    router.replace('/')
  }

  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-white/[0.06] px-5 md:px-10">
        <Logo />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-3.5" />
            New project
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            title="Sign out"
            aria-label="Sign out"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 md:px-10 md:py-14">
        {/* Title + search */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-primary/80">
              Workspace
            </p>
            <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
              Your projects
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Each project has its own canvas, brief, and generated script.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-muted-foreground">
            <Search className="size-3.5 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-36 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
              placeholder="Search projects"
              aria-label="Search projects"
            />
          </div>
        </div>

        {/* Project grid */}
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3" aria-label="Projects">
          {filtered.map((project, i) => (
            <article
              key={project.id}
              className={cn(
                'group relative min-h-52 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br bg-card p-5 transition-colors hover:border-white/[0.18] cursor-pointer',
                ACCENTS[i % ACCENTS.length],
              )}
              onClick={() => handleOpen(project.id)}
              role="button"
              tabIndex={0}
              aria-label={`Open ${project.name}`}
              onKeyDown={(e) => e.key === 'Enter' && handleOpen(project.id)}
            >
              <div className="flex items-start justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-primary">
                  <FolderKanban className="size-4" />
                </span>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(project.id) }}
                    aria-label={`Delete ${project.name}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.07] hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleOpen(project.id) }}
                    aria-label={`Open ${project.name}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.07] hover:text-foreground"
                  >
                    <ArrowUpRight className="size-4" />
                  </button>
                </div>
              </div>
              <div className="mt-16">
                <h2 className="text-base font-medium leading-snug">{project.name}</h2>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{project.type}</span>
                  <span className="text-white/20">•</span>
                  <span>{project.nodeCount} nodes</span>
                  <span className="text-white/20">•</span>
                  <span>{relativeTime(project.updatedAt)}</span>
                </div>
              </div>
            </article>
          ))}

          {/* Create card */}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.12] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.03] hover:text-foreground"
          >
            <span className="flex size-9 items-center justify-center rounded-xl border border-white/[0.09]">
              <Plus className="size-4" />
            </span>
            <span className="text-xs">Create a project</span>
          </button>
        </section>

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-primary">
              <FolderKanban className="size-6" />
            </span>
            <div>
              <p className="text-base font-medium">No projects yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first project to start writing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-3.5" />
              New project
            </button>
          </div>
        )}
      </div>

      {/* Create modal */}
      {createOpen && (
        <Modal title="New project" onClose={() => setCreateOpen(false)}>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              Project name
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/40 placeholder:text-muted-foreground/50"
                placeholder="e.g. The Long Goodbye"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              Format
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/40"
              >
                {FORMAT_OPTIONS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!name.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                Create &amp; open
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal
          title="Delete project?"
          onClose={() => setConfirmDelete(null)}
        >
          <p className="mb-6 text-sm text-muted-foreground">
            This will permanently remove the project and all its canvas data. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { deleteProject(confirmDelete); setConfirmDelete(null) }}
              className="rounded-lg bg-destructive/80 px-4 py-2 text-sm font-medium text-white hover:bg-destructive"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </main>
  )
}
