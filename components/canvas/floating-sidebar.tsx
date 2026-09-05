'use client'

import {
  ArrowDownToLine,
  BookMarked,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  FileText,
  Film,
  Flag,
  FolderKanban,
  Gauge,
  Globe,
  Grid2X2,
  Image,
  Layers,
  MessageCircle,
  Move,
  Package,
  Play,
  Plus,
  ScanLine,
  Scissors,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  Tv,
  Upload,
  Users,
  Video,
  WandSparkles,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useRef, useState, useEffect, type DragEvent, type ChangeEvent } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-context'
import { loadImportedSkills, saveImportedSkill, deleteImportedSkill, slugify, type ImportedSkill } from '@/lib/imported-skills'
import { AssetLibrary } from './asset-library'
import type { AddNodeRequest } from './add-node-menu'

// Node library grouped by purpose — each group is independently collapsible
type NodeItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  request: AddNodeRequest
}
type NodeGroup = { heading: string; items: NodeItem[] }

const NODE_GROUPS: NodeGroup[] = [
  {
    heading: 'Setup',
    items: [
      { label: 'Brief Intake',    icon: FileText, request: { type: 'brief' as const } },
      { label: 'Skill Selector',  icon: Layers,   request: { type: 'skill' as const } },
    ],
  },
  {
    heading: 'Continuity',
    items: [
      { label: 'Character Bible',    icon: Users,      request: { type: 'character-bible' as const } },
      { label: 'World / Style Lock', icon: Globe,      request: { type: 'style-lock' as const } },
      { label: 'Continuity Log',     icon: BookMarked, request: { type: 'continuity-log' as const } },
      { label: 'Continuity Checker', icon: ShieldCheck, request: { type: 'continuity' as const } },
    ],
  },
  {
    heading: 'Script stages',
    items: [
      { label: 'Hook',                icon: Zap,          request: { type: 'content' as const, kind: 'hook' as const } },
      { label: 'Scene',               icon: ScanLine,     request: { type: 'content' as const, kind: 'scene' as const } },
      { label: 'Dialogue / Narration',icon: MessageCircle,request: { type: 'content' as const, kind: 'dialogue' as const } },
      { label: 'Visual Directions',   icon: WandSparkles, request: { type: 'content' as const, kind: 'visual' as const } },
      { label: 'CTA',                 icon: Target,       request: { type: 'content' as const, kind: 'cta' as const } },
    ],
  },
  {
    heading: 'Shot layer',
    items: [
      { label: 'Shot List',        icon: Clapperboard, request: { type: 'shot-list' as const } },
      { label: 'Storyboard Frame', icon: Image,        request: { type: 'storyboard' as const } },
      { label: 'Sequence',         icon: Film,         request: { type: 'sequence' as const } },
    ],
  },
  {
    heading: 'Media generation',
    items: [
      { label: 'Generate Shot',   icon: Play,  request: { type: 'generate-shot' as const } },
      { label: 'Result',          icon: Video, request: { type: 'result' as const } },
      { label: 'Checkpoint',      icon: Flag,  request: { type: 'checkpoint' as const } },
    ],
  },
  {
    heading: 'Assembly & export',
    items: [
      { label: 'Timeline',          icon: Scissors,        request: { type: 'timeline' as const } },
      { label: 'HyperFrames',       icon: Film,            request: { type: 'hyperframes' as const } },
      { label: 'Export Package',    icon: Package,         request: { type: 'export-package' as const } },
      { label: 'Multi-Format Output',icon: Grid2X2,        request: { type: 'output' as const } },
      { label: 'Export',            icon: ArrowDownToLine, request: { type: 'export' as const } },
    ],
  },
  {
    heading: 'Autopilot',
    items: [
      { label: 'Batch Planner',        icon: Sparkles, request: { type: 'batch-planner' as const } },
      { label: 'Autopilot Dashboard',  icon: Gauge,    request: { type: 'autopilot-dashboard' as const } },
    ],
  },
  {
    heading: 'Series memory',
    items: [
      { label: 'Episode Memory', icon: BookOpen, request: { type: 'episode-memory' as const } },
      { label: 'Series Arc',     icon: Tv,       request: { type: 'series-arc' as const } },
    ],
  },
  {
    heading: 'Packs & team',
    items: [
      { label: 'Project Pack',    icon: Clapperboard, request: { type: 'project-pack' as const } },
      { label: 'Social Variants', icon: Share2,       request: { type: 'social-variants' as const } },
      { label: 'Team Workspace',  icon: Users,        request: { type: 'team-workspace' as const } },
    ],
  },
]

// Nav items: [label, icon, href | null (button)]
// 'Docs' → /docs, 'Projects' → /projects, 'Techniques' → accordion toggle, 'Assets' → panel toggle
const NAV_ITEMS = [
  ['Docs', BookOpen, '/docs'],
  ['Projects', FolderKanban, '/projects'],
  ['Skills Studio', Sparkles, '/skills'],
  ['Skill Library', BookMarked, '/skills/library'],
  ['Marketplace', Store, '/marketplace'],
  ['Techniques', WandSparkles, null],
  ['Assets', Package, null],
] as const

export function FloatingSidebar({
  onDropNode,
  projectId,
}: {
  onDropNode: (request: AddNodeRequest, event: DragEvent | React.MouseEvent) => void
  projectId: string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [active, setActive] = useState('Techniques')
  const [skillsOpen, setSkillsOpen] = useState(true)
  const [assetsOpen, setAssetsOpen] = useState(false)
  // Phase 10: per-group open state for node library — default first two groups open
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(['Setup', 'Continuity'])
  )
  const toggleGroup = (heading: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.has(heading) ? next.delete(heading) : next.add(heading)
      return next
    })
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

      <div className="flex min-h-0 flex-1 flex-col gap-5 scroll-slim overflow-y-auto p-2">
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
                <span className="flex-1 text-left">ScriptFlora Studio</span>
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
                      if (label === 'Assets') setAssetsOpen((v) => !v)
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
                        {label === 'Assets' && (
                          <ChevronDown
                            className={cn('size-3 transition-transform', assetsOpen && 'rotate-180')}
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

                {/* Assets sub-panel */}
                {label === 'Assets' && assetsOpen && !collapsed && (
                  <div className="mt-1 border-l border-white/[0.08] pb-1 pl-4">
                    <AssetLibrary projectId={projectId} />
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Node library — grouped and collapsible */}
        <section className="flex min-h-0 flex-1 flex-col scroll-slim overflow-y-auto" aria-label="Node library">
          {!collapsed && (
            <div className="flex items-center justify-between px-2.5 pb-1">
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">Nodes</span>
              <Move className="size-3 text-muted-foreground/50" />
            </div>
          )}

          {collapsed ? (
            // Collapsed: flat icon-only list
            NODE_GROUPS.flatMap((g) => g.items).map(({ label, icon: Icon, request }) => (
              <button key={label} type="button" draggable
                onDragStart={(e) => startDrag(e, request)}
                onClick={(e) => onDropNode(request, e)}
                title={label}
                className="flex justify-center py-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
              >
                <Icon className="size-3.5 shrink-0 text-muted-foreground/80" />
              </button>
            ))
          ) : (
            NODE_GROUPS.map((group) => {
              const isOpen = openGroups.has(group.heading)
              return (
                <div key={group.heading} className="mb-0.5">
                  <button type="button" onClick={() => toggleGroup(group.heading)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/55">
                      {group.heading}
                    </span>
                    <ChevronDown className={cn('size-3 text-muted-foreground/35 transition-transform duration-200', isOpen && 'rotate-180')} />
                  </button>
                  {isOpen && (
                    <div className="mb-1 ml-2 flex flex-col gap-0.5 border-l border-white/[0.06] pl-2">
                      {group.items.map(({ label, icon: Icon, request }) => (
                        <button key={label} type="button" draggable
                          onDragStart={(e) => startDrag(e, request)}
                          onClick={(e) => onDropNode(request, e)}
                          title="Drag to canvas"
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                        >
                          <Icon className="size-3.5 shrink-0 text-muted-foreground/70" />
                          <span className="truncate">{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </section>
      </div>
    </aside>
  )
}
