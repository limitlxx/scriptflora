'use client'

import { type NodeProps } from '@xyflow/react'
import {
  Check, Image as ImageIcon, Lock, LockOpen, Trash2, X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { StoryboardNode as StoryboardNodeType } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'

export function StoryboardNode({ id, data, selected }: NodeProps<StoryboardNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const disabled = Boolean(data.locked)

  const hasImage = Boolean(data.imageUrl)

  const handleApprove = () => {
    if (!hasImage) return
    update(id, { status: 'approved', locked: true })
  }

  const handleReject = () => {
    update(id, { imageUrl: undefined, status: 'empty' })
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={320}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            {hasImage && !data.locked && (
              <>
                <ToolbarButton icon={Check} label="Approve frame" tone="accent" onClick={handleApprove} />
                <ToolbarButton icon={X} label="Reject frame" tone="danger" onClick={handleReject} />
                <ToolbarDivider />
              </>
            )}
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
          icon={ImageIcon}
          title="Storyboard Frame"
          subtitle={data.shotLabel || 'Key-frame for a shot'}
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3 px-4 py-3.5">
          {/* Shot label */}
          <label className="block">
            <FieldLabel>Shot label</FieldLabel>
            <input
              value={data.shotLabel}
              disabled={disabled}
              onChange={(e) => update(id, { shotLabel: e.target.value })}
              placeholder="Shot 3 — Wide establishing"
              className={fieldClass}
            />
          </label>

          {/* Image slot */}
          {data.imageUrl ? (
            <div className="group relative overflow-hidden rounded-xl border border-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.imageUrl}
                alt={`Storyboard: ${data.shotLabel}`}
                className="aspect-video w-full object-cover"
              />
              {data.status === 'approved' && (
                <div className="absolute inset-0 flex items-end justify-start bg-gradient-to-t from-black/40 to-transparent p-2">
                  <span className="flex items-center gap-1 rounded-md bg-success/20 px-2 py-1 text-[9.5px] font-medium text-success backdrop-blur-sm">
                    <Check className="size-2.5" /> Approved — used as video reference
                  </span>
                </div>
              )}
              {!disabled && !data.locked && (
                <button
                  type="button"
                  onClick={handleReject}
                  className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Remove
                </button>
              )}
            </div>
          ) : (
            <label className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8',
              'border-white/[0.12] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground',
              disabled && 'pointer-events-none opacity-40',
            )}>
              <ImageIcon className="size-6" />
              <span className="text-[11px]">Upload storyboard frame</span>
              <span className="text-[10px] text-muted-foreground/60">PNG, JPG, WEBP</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => update(id, { imageUrl: reader.result as string, status: 'draft' })
                  reader.readAsDataURL(file)
                  e.target.value = ''
                }}
              />
            </label>
          )}

          {/* Director notes */}
          <label className="block">
            <FieldLabel>Director notes</FieldLabel>
            <textarea
              value={data.notes}
              disabled={disabled}
              onChange={(e) => update(id, { notes: e.target.value })}
              placeholder="Framing, mood, reference for video generation…"
              rows={2}
              className={cn(fieldClass, 'resize-none')}
            />
          </label>

          {/* Approve / reject CTAs */}
          {hasImage && !data.locked && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApprove}
                className={cn(
                  'nodrag flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[11.5px] font-medium transition-all',
                  'bg-success/15 text-success hover:bg-success/25 border border-success/20',
                )}
              >
                <Check className="size-3.5" />
                Approve frame
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="nodrag flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] py-2 text-[11.5px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
              >
                <X className="size-3.5" />
                Reject
              </button>
            </div>
          )}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{data.status === 'approved' ? 'Used as video reference' : hasImage ? 'Awaiting approval' : 'No frame yet'}</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
