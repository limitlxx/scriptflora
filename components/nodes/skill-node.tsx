'use client'

import { type NodeProps } from '@xyflow/react'
import { Check, FileText, Layers, Lock, LockOpen, RefreshCw, Trash2, WandSparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { SkillNode as SkillNodeType } from '@/lib/flow-types'
import { loadImportedSkills, type ImportedSkill } from '@/lib/imported-skills'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  NodeDivider,
  NodeFooter,
  NodeHeader,
  NodeShell,
  ToolbarButton,
  ToolbarDivider,
} from './node-shell'

type SkillOption = {
  id: string
  name: string
  tagline: string
  stages: string
  icon: React.ComponentType<{ className?: string }>
  markdown?: string
}

const BUILT_IN: SkillOption[] = [
  {
    id: 'standard',
    name: 'Standard Script',
    tagline: 'Hook, scenes, dialogue, visual direction, close. Reliable structure for brand and social work.',
    stages: '5 stages',
    icon: Layers,
  },
  {
    id: 'auteur',
    name: 'Storyline Auteur Script',
    tagline: 'Stageplay → Screenplay → Technical Screenplay → Production Summary → Auteur Script. Built for generative video continuity.',
    stages: '5 stages',
    icon: WandSparkles,
  },
]

export function SkillNode({ id, data, selected }: NodeProps<SkillNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const [importedSkills, setImportedSkills] = useState<ImportedSkill[]>([])
  const disabled = Boolean(data.locked)

  // Load imported skills from localStorage + keep in sync
  useEffect(() => {
    setImportedSkills(loadImportedSkills())
    const sync = () => setImportedSkills(loadImportedSkills())
    window.addEventListener('sf:skills:change', sync)
    return () => window.removeEventListener('sf:skills:change', sync)
  }, [])

  const allSkills: SkillOption[] = [
    ...BUILT_IN,
    ...importedSkills.map((s) => ({
      id: s.id,
      name: s.name,
      tagline: 'Custom imported skill',
      stages: 'Custom pipeline',
      icon: FileText,
      markdown: s.markdown,
    })),
  ]

  const selectedSkill = allSkills.find((s) => s.id === data.selected)

  const handleSelect = (skill: SkillOption) => {
    update(id, {
      selected: skill.id,
      skillMarkdown: skill.markdown ?? '',
    })
    setOpen(false)
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        width={352}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton
              icon={RefreshCw}
              label="Generate stages"
              onClick={() => act(id, 'regenerate')}
              disabled={!data.selected || disabled}
            />
            <ToolbarDivider />
            <ToolbarButton
              icon={data.locked ? LockOpen : Lock}
              label={data.locked ? 'Unlock' : 'Lock'}
              active={data.locked}
              onClick={() => act(id, data.locked ? 'unlock' : 'lock')}
            />
            <ToolbarDivider />
            <ToolbarButton
              icon={Trash2}
              label="Delete node"
              tone="danger"
              onClick={() => act(id, 'delete')}
            />
          </>
        }
      >
        <NodeHeader
          icon={Layers}
          title="Skill"
          subtitle="Choose a method"
          right={
            data.selected ? (
              <span className="text-primary bg-accent-muted rounded-full px-2 py-0.5 text-[10px] font-medium">
                Selected
              </span>
            ) : (
              <span className="text-muted-foreground text-[10px]">Required</span>
            )
          }
        />
        <NodeDivider />

        {/* Dropdown trigger */}
        <div className="px-3 py-3">
          <button
            type="button"
            className="nodrag flex w-full items-center justify-between rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2.5 text-left transition-colors hover:border-white/[0.14]"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <span>
              <span className="block text-[12px] font-medium text-foreground/90">
                {selectedSkill?.name ?? 'Choose a skill'}
              </span>
              <span className="mt-1 block text-[10px] text-muted-foreground">
                {open ? 'Select a method' : selectedSkill ? selectedSkill.stages : 'Open skill library'}
              </span>
            </span>
            <span className="text-muted-foreground text-xs">{open ? '−' : '+'}</span>
          </button>
        </div>

        {/* Skill list */}
        {open && (
          <div role="radiogroup" aria-label="Script method" className="flex flex-col gap-2 px-3 pb-3">
            {allSkills.map((skill) => {
              const isActive = data.selected === skill.id
              const Icon = skill.icon
              return (
                <button
                  key={skill.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  disabled={disabled}
                  onClick={() => handleSelect(skill)}
                  className={cn(
                    'nodrag group/card relative w-full rounded-xl border p-3 text-left transition-all duration-200',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
                    isActive
                      ? 'border-primary/45 bg-accent-muted'
                      : 'hover:bg-elevated/60 border-white/[0.07] bg-black/20 hover:border-white/[0.14]',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={cn('size-3 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn('text-[12.5px] leading-tight font-medium tracking-[-0.01em] truncate', isActive ? 'text-foreground' : 'text-foreground/90')}>
                        {skill.name}
                      </span>
                    </div>
                    <span className={cn(
                      'mt-px flex size-4 shrink-0 items-center justify-center rounded-full border transition-all duration-200',
                      isActive ? 'border-primary bg-primary' : 'border-white/20 group-hover/card:border-white/35',
                    )}>
                      {isActive && <Check className="text-primary-foreground size-2.5" />}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-[11px] leading-relaxed pl-5">
                    {skill.tagline}
                  </p>
                  <span className="text-muted-foreground/70 mt-2 block font-mono text-[10px] pl-5">
                    {skill.stages}
                  </span>
                </button>
              )
            })}

            {importedSkills.length === 0 && (
              <p className="px-1 py-1 text-[10.5px] text-muted-foreground/60">
                Import a skill .md file from the sidebar to see it here.
              </p>
            )}
          </div>
        )}

        <NodeDivider />
        <NodeFooter>
          <span>Determines downstream stages</span>
          {selectedSkill && (
            <span className="font-mono text-[10px] text-muted-foreground/60">
              {selectedSkill.stages}
            </span>
          )}
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
