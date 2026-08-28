'use client'

import {
  ArrowDownToLine,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderKanban,
  Grid2X2,
  Layers,
  MessageCircle,
  Move,
  Plus,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Users,
  WandSparkles,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useRef, useState, useEffect, type DragEvent, type ChangeEvent } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-context'
import { loadImportedSkills, saveImportedSkill, deleteImportedSkill, slugify, type ImportedSkill } from '@/lib/imported-skills'
import type { AddNodeRequest } from './script-flow-canvas'

const library = [
  { label: 'Brief Intake', icon: FileText, request: { type: 'brief' as const } },
  { label: 'Skill Selector', icon: Layers, request: { type: 'skill' as const } },
  { label: 'Hook', icon: Zap, request: { type: 'content' as const, kind: 'hook' as const } },
  { label: 'Scene', icon: ScanLine, request: { type: 'content' as const, kind: 'scene' as const } },
  { label: 'Dialogue / Narration', icon: MessageCircle, request: { type: 'content' as const, kind: 'dialogue' as const } },
  { label: 'Visual Directions', icon: WandSparkles, request: { type: 'content' as const, kind: 'visual' as const } },
  { label: 'CTA', icon: Target, request: { type: 'content' as const, kind: 'cta' as const } },
  { label: 'Continuity Checker', icon: ShieldCheck, request: { type: 'continuity' as const } },
  { label: 'Multi-Format Output', icon: Grid2X2, request: { type: 'output' as const } },
  { label: 'Export', icon: ArrowDownToLine, request: { type: 'export' as const } },
]

// Nav items: [label, icon, href | null (button)]
// 'Docs' → /docs, 'Projects' → /projects, 'Techniques' → accordion toggle
const NAV_ITEMS = [
  ['Docs', BookOpen, '/docs'],
  ['Projects', FolderKanban, '/projects'],
  ['Techniques', WandSparkles, null],
  // ['Community', Users, null],
] as const

export function FloatingSidebar({
  onDropNode,
}: {
  onDropNode: (request: AddNodeRequest, event: DragEvent | React.MouseEvent) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [active, setActive] = useState('Techniques')
  const [skillsOpen, setSkillsOpen] = useState(true)
  const [importedSkills, setImportedSkills] = useState<ImportedSkill[]>([])
  const importRef = useRef<HTMLInputElement>(null)
  const auth = useAuth()

  // Load persisted imported skills on mount + listen for changes
  useEffect(() => {
    setImportedSkills(loadImportedSkills())
    const sync = () => setImportedSkills(loadImportedSkills())
    window.addEventListener('sf:skills:change', sync)
    return () => window.removeEventListener('sf:skills:change', sync)
  }, [])

  // Derive display name from session
  const email = auth.status === 'authenticated' ? (auth.user?.email ?? '') : ''
  const displayName = email
    ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Your workspace'

  const startDrag = (event: DragEvent<HTMLButtonElement>, request: AddNodeRequest) => {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('application/ScriptFlora-node', JSON.stringify(request))
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    for (const file of files) {
      const markdown = await file.text()
      saveImportedSkill({
        id: slugify(file.name),
        name: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        markdown,
      })
    }
    event.target.value = ''
  }

  return (
    <aside
      className={cn(
        'absolute left-3 top-14 z-20 flex h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded-2xl',
        'border border-white/[0.08] bg-[oklch(0.145_0.004_285/0.94)] shadow-[0_20px_50px_-24px_oklch(0_0_0/0.8)]',
        'backdrop-blur-2xl transition-[width] duration-300',
        collapsed ? 'w-12' : 'w-64',
      )}
      aria-label="ScriptFlora workspace sidebar"
    >
      {/* Workspace header */}
      <div className="flex h-14 shrink-0 items-center border-b border-white/[0.06] px-2.5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 text-left hover:bg-white/[0.04]"
          aria-label="Workspace"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="size-3.5" />
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-medium text-foreground/90">
                {displayName}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                {email || 'ScriptFlora'}
              </span>
            </span>
          )}
          {!collapsed && <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />}
        </button>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-2">
        {/* Quick actions */}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
              collapsed && 'justify-center px-0',
            )}
            title="Script Studio"
          >
            <Sparkles className="size-3.5 shrink-0 text-primary/80" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Script Studio</span>
                <span className="rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[9px] text-emerald-300">
                  Coming Soon
                </span>
              </>
            )}
          </button>
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
              collapsed && 'justify-center px-0',
            )}
            title="Create"
          >
            <Plus className="size-3.5 shrink-0" />
            {!collapsed && <span>Create</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5" aria-label="Main navigation">
          {NAV_ITEMS.map(([label, Icon, href]) => {
            const isActive = active === label
            const baseClass = cn(
              'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] transition-colors',
              isActive
                ? 'bg-white/[0.07] text-foreground'
                : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground',
              collapsed && 'justify-center px-0',
            )

            return (
              <div key={label}>
                {href ? (
                  <Link
                    href={href}
                    onClick={() => setActive(label)}
                    className={baseClass}
                    title={label}
                  >
                    <Icon className={cn('size-3.5 shrink-0', isActive && 'text-primary')} />
                    {!collapsed && <span className="flex-1 text-left">{label}</span>}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActive(label)
                      if (label === 'Techniques') setSkillsOpen((v) => !v)
                    }}
                    className={baseClass}
                    title={label}
                  >
                    <Icon className={cn('size-3.5 shrink-0', isActive && 'text-primary')} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{label}</span>
                        {label === 'Techniques' && (
                          <ChevronDown
                            className={cn('size-3 transition-transform', skillsOpen && 'rotate-180')}
                          />
                        )}
                      </>
                    )}
                  </button>
                )}

                {/* Techniques sub-menu */}
                {label === 'Techniques' && skillsOpen && !collapsed && (
                  <div className="mt-1 flex flex-col gap-1 border-l border-white/[0.08] pb-1 pl-4">
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => startDrag(e, { type: 'skill' })}
                      onClick={(e) => onDropNode({ type: 'skill' }, e)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[10px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                    >
                      <Layers className="size-3 text-primary/70" />
                      Standard Script
                    </button>
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => startDrag(e, { type: 'skill' })}
                      onClick={(e) => onDropNode({ type: 'skill' }, e)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[10px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                    >
                      <WandSparkles className="size-3 text-primary/70" />
                      Auteur Method
                    </button>
                    {importedSkills.map((skill) => (
                      <div key={skill.id} className="flex items-center gap-1">
                        <button
                          type="button"
                          draggable
                          onDragStart={(e) => startDrag(e, { type: 'skill', skillId: skill.id, skillMarkdown: skill.markdown })}
                          onClick={(e) => onDropNode({ type: 'skill', skillId: skill.id, skillMarkdown: skill.markdown }, e)}
                          className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-[10px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                        >
                          <FileText className="size-3 shrink-0" />
                          <span className="truncate">{skill.name}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteImportedSkill(skill.id)}
                          aria-label={`Remove ${skill.name}`}
                          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/40 hover:text-destructive"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <input
                      ref={importRef}
                      type="file"
                      accept=".json,.txt,.md"
                      multiple
                      className="hidden"
                      onChange={handleImport}
                    />
                    <button
                      type="button"
                      onClick={() => importRef.current?.click()}
                      className="mt-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[10px] text-primary/80 hover:bg-primary/10 hover:text-primary"
                    >
                      <Upload className="size-3" />
                      Import skill
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Node library */}
        <section className="flex min-h-0 flex-1 flex-col gap-1" aria-label="Node library">
          {!collapsed && (
            <div className="flex items-center justify-between px-2.5 pb-1">
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
                Nodes
              </span>
              <Move className="size-3 text-muted-foreground/50" />
            </div>
          )}
          {library.map(({ label, icon: Icon, request }) => (
            <button
              key={label}
              type="button"
              draggable
              onDragStart={(e) => startDrag(e, request)}
              onClick={(e) => onDropNode(request, e)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground',
                collapsed && 'justify-center px-0',
              )}
              title={collapsed ? label : 'Drag to canvas'}
            >
              <Icon className="size-3.5 shrink-0 text-muted-foreground/80" />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          ))}
        </section>
      </div>
    </aside>
  )
}
