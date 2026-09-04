'use client'

import { type NodeProps } from '@xyflow/react'
import { Check, Globe, Lock, LockOpen, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { StyleLockNode as StyleLockNodeType } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'

const MEDIUM_OPTIONS = [
  { id: 'live-action', label: 'Live-action' },
  { id: 'animation', label: 'Animation' },
  { id: 'hybrid', label: 'Hybrid' },
] as const

export function StyleLockNode({ id, data, selected }: NodeProps<StyleLockNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const disabled = Boolean(data.locked)

  const set = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) =>
    update(id, { [key]: value, status: 'draft' })

  const handleLockStyle = () => {
    // Locking the style lock node means the style rules are finalised
    update(id, { locked: !data.locked, status: data.locked ? 'draft' : 'approved' })
  }

  const isComplete = data.visualRules?.trim() && data.hardConstraints?.trim()

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
            <ToolbarButton
              icon={data.locked ? LockOpen : Lock}
              label={data.locked ? 'Unlock style' : 'Lock style'}
              active={data.locked}
              onClick={handleLockStyle}
            />
            <ToolbarDivider />
            <ToolbarButton icon={Trash2} label="Delete node" tone="danger" onClick={() => act(id, 'delete')} />
          </>
        }
      >
        <NodeHeader
          icon={Globe}
          title="World / Style Lock"
          subtitle="Visual rules for the whole project"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3.5 px-4 py-3.5">
          {/* Medium */}
          <div>
            <FieldLabel>Medium</FieldLabel>
            <div className="flex gap-1.5">
              {MEDIUM_OPTIONS.map((opt) => {
                const active = data.medium === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={disabled}
                    aria-pressed={active}
                    onClick={() => set('medium', opt.id)}
                    className={cn(
                      'nodrag flex-1 rounded-lg border py-1.5 text-[11px] transition-all duration-150',
                      'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none',
                      active
                        ? 'border-primary/45 bg-accent-muted text-primary'
                        : 'border-white/[0.08] bg-black/20 text-muted-foreground hover:border-white/[0.15] hover:text-foreground',
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Visual rules */}
          <label className="block">
            <FieldLabel>Visual rules &amp; palette</FieldLabel>
            <textarea
              value={data.visualRules}
              disabled={disabled}
              onChange={(e) => set('visualRules', e.target.value)}
              placeholder="Color palette, era, lighting mood, grain level, lens style…"
              rows={3}
              className={cn(fieldClass, 'resize-none')}
            />
          </label>

          {/* Locations */}
          <label className="block">
            <FieldLabel>Key locations</FieldLabel>
            <textarea
              value={data.locations}
              disabled={disabled}
              onChange={(e) => set('locations', e.target.value)}
              placeholder="Interior darkroom, coastal cliff, city rooftop…"
              rows={2}
              className={cn(fieldClass, 'resize-none')}
            />
          </label>

          {/* Hard constraints */}
          <label className="block">
            <FieldLabel>Hard constraints — must never change</FieldLabel>
            <textarea
              value={data.hardConstraints}
              disabled={disabled}
              onChange={(e) => set('hardConstraints', e.target.value)}
              placeholder="No daylight scenes. Brand colour #1A2B3C must appear. No CGI backgrounds."
              rows={2}
              className={cn(fieldClass, 'resize-none')}
            />
          </label>

          {/* Lock CTA */}
          {!disabled && isComplete && (
            <button
              type="button"
              onClick={handleLockStyle}
              className={cn(
                'nodrag flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-medium transition-all',
                'bg-success/15 text-success hover:bg-success/25 border border-success/20',
              )}
            >
              <Check className="size-3.5" />
              Lock style rules — inject into all generations
            </button>
          )}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{data.medium ?? 'Medium not set'}</span>
          {data.locked && (
            <span className="flex items-center gap-1 text-success">
              <Check className="size-2.5" /> Rules locked
            </span>
          )}
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
