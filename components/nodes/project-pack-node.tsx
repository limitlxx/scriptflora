'use client'

import { type NodeProps } from '@xyflow/react'
import {
  BookOpen, Check, Clapperboard, Film, Lock, LockOpen, Sparkles, Trash2, Tv, Zap,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ProjectPackNode as ProjectPackNodeType, PackId } from '@/lib/flow-types'
import { PACK_CONFIGS } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider,
} from './node-shell'

const PACK_ICONS: Record<PackId, React.ComponentType<{ className?: string }>> = {
  ads: Zap,
  series: Tv,
  animation: Sparkles,
  education: BookOpen,
  hybrid: Film,
}

export function ProjectPackNode({ id, data, selected }: NodeProps<ProjectPackNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [applied, setApplied] = useState(false)
  const disabled = Boolean(data.locked)

  const selected_pack = data.selectedPack ? PACK_CONFIGS[data.selectedPack] : null

  const handleApply = () => {
    if (!data.selectedPack) return
    const cfg = PACK_CONFIGS[data.selectedPack]

    // Apply pack defaults to canvas nodes
    type CanvasNode = { id: string; type?: string; data: Record<string, unknown> }
    const allNodes = ((window as unknown as Record<string, unknown>).__ScriptFloraNodes as CanvasNode[] | undefined) ?? []

    // Apply style lock medium if a style-lock node exists and isn't locked
    const styleLock = allNodes.find((n) => n.type === 'style-lock')
    if (styleLock && !styleLock.data.locked) {
      // ponytail: we can't call update() for another node from here without the
      // node action context scoped to that node. We dispatch a custom event instead
      // so the canvas can apply the pack defaults in one place.
      window.dispatchEvent(new CustomEvent('sf:pack:apply', {
        detail: { packId: data.selectedPack, config: cfg.defaults },
      }))
    }

    update(id, { status: 'approved', appliedAt: new Date().toISOString() })
    setApplied(true)
    window.setTimeout(() => setApplied(false), 2500)
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={380}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton icon={data.locked ? LockOpen : Lock} label={data.locked ? 'Unlock' : 'Lock'}
              active={data.locked} onClick={() => act(id, data.locked ? 'unlock' : 'lock')} />
            <ToolbarDivider />
            <ToolbarButton icon={Trash2} label="Delete node" tone="danger" onClick={() => act(id, 'delete')} />
          </>
        }
      >
        <NodeHeader
          icon={Clapperboard}
          title="Project Pack"
          subtitle="Medium-specific defaults"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3 px-4 py-3.5">
          {/* Pack cards */}
          <div className="grid grid-cols-1 gap-1.5">
            {Object.values(PACK_CONFIGS).map((pack) => {
              const isActive = data.selectedPack === pack.packId
              const Icon = PACK_ICONS[pack.packId]
              return (
                <button
                  key={pack.packId}
                  type="button"
                  disabled={disabled}
                  aria-pressed={isActive}
                  onClick={() => update(id, { selectedPack: pack.packId, status: 'draft' })}
                  className={cn(
                    'nodrag flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
                    isActive
                      ? 'border-primary/45 bg-accent-muted'
                      : 'border-white/[0.07] bg-black/20 hover:border-white/[0.14]',
                  )}
                >
                  <Icon className={cn('size-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-[12px] font-medium', isActive ? 'text-foreground' : 'text-foreground/80')}>
                      {pack.name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                      {pack.defaults.medium} · checkpoints: {pack.defaults.checkpointFrequency.replace('every-', 'every ')}
                      {pack.defaults.identityLockRequired ? ' · identity lock required' : ''}
                      {pack.defaults.seriesContinuity ? ' · series memory' : ''}
                    </p>
                  </div>
                  {isActive && <Check className="size-3.5 shrink-0 text-primary" />}
                </button>
              )
            })}
          </div>

          {/* Apply button */}
          {data.selectedPack && (
            <button
              type="button"
              onClick={handleApply}
              disabled={disabled}
              className={cn(
                'nodrag flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-medium transition-all',
                'disabled:pointer-events-none disabled:opacity-50',
                applied
                  ? 'bg-success/15 text-success border border-success/25'
                  : 'bg-primary text-primary-foreground hover:opacity-90',
              )}
            >
              {applied
                ? <><Check className="size-4" />Pack applied</>
                : <><Clapperboard className="size-4" />Apply {selected_pack?.name} defaults</>
              }
            </button>
          )}

          {data.appliedAt && (
            <p className="text-center text-[10px] text-muted-foreground/60">
              Applied: {new Date(data.appliedAt).toLocaleString()}
            </p>
          )}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{selected_pack?.name ?? 'No pack selected'}</span>
          {data.selectedPack && (
            <span className="font-mono text-[10px] text-muted-foreground/60">{data.selectedPack}</span>
          )}
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
