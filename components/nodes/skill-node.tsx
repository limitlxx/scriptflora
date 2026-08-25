'use client'

import { type NodeProps } from '@xyflow/react'
import { Check, Layers, Lock, LockOpen, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { SkillId, SkillNode as SkillNodeType } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  NodeDivider,
  NodeFooter,
  NodeHeader,
  NodeShell,
  ToolbarButton,
  ToolbarDivider,
} from './node-shell'

const SKILLS: {
  id: SkillId
  name: string
  tagline: string
  stages: string
}[] = [
  {
    id: 'standard',
    name: 'Standard Script',
    tagline:
      'Hook, scenes, dialogue, visual direction, close. Reliable structure for brand and social work.',
    stages: '5 stages',
  },
  {
    id: 'auteur',
    name: 'Storyline Auteur Script',
    tagline:
      'Stageplay → Screenplay → Technical Screenplay → Production Summary → Auteur Script. Built for generative video continuity.',
    stages: '5 stages',
  },
]

export function SkillNode({ id, data, selected }: NodeProps<SkillNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const disabled = Boolean(data.locked)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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
              <span className="text-muted-foreground text-[10px]">
                Required
              </span>
            )
          }
        />
        <NodeDivider />

        <div className="px-3 py-3">
          <button type="button" className="nodrag flex w-full items-center justify-between rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2.5 text-left transition-colors hover:border-white/[0.14]" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
            <span><span className="block text-[12px] font-medium text-foreground/90">{SKILLS.find((skill) => skill.id === data.selected)?.name ?? 'Choose a skill'}</span><span className="mt-1 block text-[10px] text-muted-foreground">{open ? 'Select a method' : 'Open skill library'}</span></span>
            <span className="text-muted-foreground text-xs">{open ? '−' : '+'}</span>
          </button>
        </div>
        {open && <div role="radiogroup" aria-label="Script method" className="flex flex-col gap-2 px-3 pb-3">
          {SKILLS.map((skill) => {
            const active = data.selected === skill.id
            return (
              <button
                key={skill.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => update(id, { selected: skill.id })}
                className={cn(
                  'nodrag group/card relative w-full rounded-xl border p-3 text-left transition-all duration-200',
                  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                  'disabled:pointer-events-none',
                  active
                    ? 'border-primary/45 bg-accent-muted'
                    : 'hover:bg-elevated/60 border-white/[0.07] bg-black/20 hover:border-white/[0.14]',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      'text-[12.5px] leading-tight font-medium tracking-[-0.01em]',
                      active ? 'text-foreground' : 'text-foreground/90',
                    )}
                  >
                    {skill.name}
                  </span>
                  <span
                    className={cn(
                      'mt-px flex size-4 shrink-0 items-center justify-center rounded-full border transition-all duration-200',
                      active
                        ? 'border-primary bg-primary'
                        : 'border-white/20 group-hover/card:border-white/35',
                    )}
                  >
                    {active && (
                      <Check className="text-primary-foreground size-2.5" />
                    )}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1.5 text-[11px] leading-relaxed">
                  {skill.tagline}
                </p>
                <span className="text-muted-foreground/70 mt-2 block font-mono text-[10px]">
                  {skill.stages}
                </span>
              </button>
            )
          })}
        </div>}

        <NodeDivider />
        <NodeFooter>
          <span>Determines downstream stages</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
