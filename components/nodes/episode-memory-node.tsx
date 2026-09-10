'use client'

import { type NodeProps } from '@xyflow/react'
import { BookMarked, ChevronRight, Lock, LockOpen, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { EpisodeMemoryNode as EpisodeMemoryNodeType } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader, NodeShell,
  StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'

/**
 * Episode Memory node — persists series-wide facts across episodes.
 *
 * Character Bible: locked world/character rules, injected into every brief.
 * Previous Episode: what changed last episode; cleared when moving to next.
 *
 * On "Inject into Brief": finds the connected Brief node via the window global
 * and appends both fields to its additionalNotes so the model always has context.
 */
export function EpisodeMemoryNode({ id, data, selected }: NodeProps<EpisodeMemoryNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)

  // Local draft state — same pattern as content-node to avoid cursor-jump
  const [localBible, setLocalBible] = useState(data.characterBible)
  const [localPrev, setLocalPrev] = useState(data.previousEpisode)

  const prevBible = useRef(data.characterBible)
  const prevPrev = useRef(data.previousEpisode)
  useEffect(() => {
    if (data.characterBible !== prevBible.current) { setLocalBible(data.characterBible); prevBible.current = data.characterBible }
  }, [data.characterBible])
  useEffect(() => {
    if (data.previousEpisode !== prevPrev.current) { setLocalPrev(data.previousEpisode); prevPrev.current = data.previousEpisode }
  }, [data.previousEpisode])

  const disabled = Boolean(data.locked)

  /** Append memory to the connected Brief's additionalNotes. */
  const injectIntoBrief = () => {
    type Node = { id: string; type?: string; data: Record<string, unknown> }
    const allNodes = (window as unknown as Record<string, unknown>).__ScriptFloraNodes as Node[] ?? []
    const updateNode = (window as unknown as Record<string, unknown>).__ScriptFloraUpdateNode as
      ((id: string, patch: Record<string, unknown>) => void) | undefined

    if (!updateNode) return

    const brief = allNodes.find((n) => n.type === 'brief')
    if (!brief) return

    const existingNotes = (brief.data.additionalNotes as string) || ''
    const memoryBlock = [
      localBible.trim() && `CHARACTER BIBLE:\n${localBible.trim()}`,
      localPrev.trim() && `PREVIOUS EPISODE:\n${localPrev.trim()}`,
    ].filter(Boolean).join('\n\n')

    if (!memoryBlock) return

    // Remove any previously injected block then re-append fresh
    const stripped = existingNotes.replace(/\n?CHARACTER BIBLE:[\s\S]*?(?=\n[A-Z]|\n\n[A-Z]|$)/g, '').trim()
    updateNode(brief.id, { additionalNotes: stripped ? `${stripped}\n\n${memoryBlock}` : memoryBlock })
    update(id, { status: 'approved' })
  }

  /** Advance episode counter and clear the previous-episode recap field. */
  const nextEpisode = () => {
    update(id, {
      episodeNumber: data.episodeNumber + 1,
      previousEpisode: '',
      status: 'draft',
    })
    setLocalPrev('')
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={360}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton
              icon={RefreshCw}
              label="Inject memory into Brief"
              onClick={injectIntoBrief}
              disabled={disabled}
              tone="accent"
            />
            <ToolbarButton
              icon={data.locked ? LockOpen : Lock}
              label={data.locked ? 'Unlock' : 'Lock'}
              active={data.locked}
              onClick={() => act(id, data.locked ? 'unlock' : 'lock')}
            />
            <ToolbarDivider />
            <ToolbarButton icon={Trash2} label="Delete node" tone="danger" onClick={() => act(id, 'delete')} />
          </>
        }
      >
        <NodeHeader
          icon={BookMarked}
          title="Episode Memory"
          subtitle={`Episode ${data.episodeNumber}`}
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3.5 px-4 py-3.5">
          {/* Character Bible */}
          <label className="block">
            <FieldLabel>Character Bible</FieldLabel>
            <textarea
              value={localBible}
              disabled={disabled}
              onChange={(e) => setLocalBible(e.target.value)}
              onBlur={(e) => update(id, { characterBible: e.target.value })}
              placeholder="Names, descriptions, relationships, recurring props, world rules — anything that must stay consistent across every episode."
              rows={4}
              className={cn(fieldClass, 'scroll-slim resize-none text-[11.5px]')}
            />
          </label>

          {/* Previous episode recap */}
          <label className="block">
            <FieldLabel>Previous Episode Recap</FieldLabel>
            <textarea
              value={localPrev}
              disabled={disabled}
              onChange={(e) => setLocalPrev(e.target.value)}
              onBlur={(e) => update(id, { previousEpisode: e.target.value })}
              placeholder="What happened last episode? What threads are open? What changed for each character?"
              rows={3}
              className={cn(fieldClass, 'scroll-slim resize-none text-[11.5px]')}
            />
          </label>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={injectIntoBrief}
              disabled={disabled}
              className={cn(
                'nodrag flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11.5px] font-medium',
                'bg-primary/15 text-primary hover:bg-primary/25 transition-colors disabled:opacity-40 disabled:pointer-events-none',
              )}
            >
              <RefreshCw className="size-3" />
              Inject into Brief
            </button>
            <button
              type="button"
              onClick={nextEpisode}
              disabled={disabled}
              title={`Advance to Episode ${data.episodeNumber + 1} and clear the recap`}
              className={cn(
                'nodrag flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11.5px]',
                'border border-white/[0.08] text-muted-foreground hover:text-foreground hover:border-white/[0.15] transition-colors disabled:opacity-40 disabled:pointer-events-none',
              )}
            >
              <ChevronRight className="size-3" />
              Ep {data.episodeNumber + 1}
            </button>
          </div>
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>
            {localBible.trim()
              ? `Bible: ${localBible.trim().split(/\s+/).length} words`
              : 'No bible yet'}
          </span>
          <span className="font-mono text-[10px]">Ep {data.episodeNumber}</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
