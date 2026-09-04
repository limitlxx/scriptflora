'use client'

import { type NodeProps } from '@xyflow/react'
import {
  Check, Film, Info, Lock, LockOpen, RefreshCw, Trash2, X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ResultNode as ResultNodeType, ResultStatus } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'

const RESULT_STATUS_STYLE: Record<ResultStatus, { label: string; cls: string }> = {
  generated:  { label: 'Generated',  cls: 'text-primary bg-primary/10' },
  in_review:  { label: 'In review',  cls: 'text-warning bg-warning/10' },
  approved:   { label: 'Approved',   cls: 'text-success bg-success/10' },
  rejected:   { label: 'Rejected',   cls: 'text-destructive bg-destructive/10' },
}

export function ResultNode({ id, data, selected }: NodeProps<ResultNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [showProvenance, setShowProvenance] = useState(false)
  const disabled = Boolean(data.locked)
  const rs = RESULT_STATUS_STYLE[data.resultStatus ?? 'generated']

  const approve = () => update(id, { resultStatus: 'approved', status: 'approved' })
  const reject = () => update(id, { resultStatus: 'rejected', status: 'draft' })
  const markReview = () => update(id, { resultStatus: 'in_review' })

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={340}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            {!disabled && data.resultStatus !== 'approved' && (
              <ToolbarButton icon={Check} label="Approve" tone="accent" onClick={approve} />
            )}
            {!disabled && data.resultStatus !== 'rejected' && (
              <ToolbarButton icon={X} label="Reject" tone="danger" onClick={reject} />
            )}
            <ToolbarDivider />
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
          icon={Film}
          title="Result"
          subtitle="Generated clip + audio"
          right={
            <span className={cn('rounded-full px-2 py-0.5 text-[9.5px] font-medium', rs.cls)}>
              {rs.label}
            </span>
          }
        />
        <NodeDivider />

        <div className="space-y-3 px-4 py-3.5">
          {/* Video preview */}
          {data.videoUrl ? (
            <div className="overflow-hidden rounded-xl border border-white/[0.08]">
              <video
                src={data.videoUrl}
                controls
                className="aspect-video w-full bg-black"
                aria-label="Generated video clip"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-white/[0.12] bg-black/20">
              {data.status === 'generating' ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <RefreshCw className="size-5 animate-spin" />
                  <span className="text-[11px]">Generating…</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                  <Film className="size-5" />
                  <span className="text-[10.5px]">No clip yet</span>
                </div>
              )}
            </div>
          )}

          {/* Audio track */}
          {data.audioUrl && (
            <div>
              <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Dialogue audio
              </span>
              <audio src={data.audioUrl} controls className="h-8 w-full" aria-label="Dialogue audio track" />
            </div>
          )}

          {/* Rejection reason */}
          {data.resultStatus === 'rejected' && (
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Rejection reason
              </span>
              <textarea
                value={data.rejectionReason ?? ''}
                disabled={disabled}
                onChange={(e) => update(id, { rejectionReason: e.target.value })}
                placeholder="Why rejected? (helps regen context)"
                rows={2}
                className={cn(fieldClass, 'resize-none')}
              />
            </label>
          )}

          {/* Approve / reject / review buttons */}
          {!disabled && (
            <div className="flex gap-2">
              <button type="button" onClick={approve}
                disabled={data.resultStatus === 'approved'}
                className={cn(
                  'nodrag flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[11.5px] font-medium transition-all',
                  'disabled:pointer-events-none disabled:opacity-40',
                  data.resultStatus === 'approved'
                    ? 'border border-success/30 bg-success/15 text-success'
                    : 'bg-success/15 text-success hover:bg-success/25 border border-success/20',
                )}
              >
                <Check className="size-3.5" />
                {data.resultStatus === 'approved' ? 'Approved' : 'Approve'}
              </button>
              <button type="button" onClick={reject}
                disabled={data.resultStatus === 'rejected'}
                className="nodrag flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] py-2 text-[11.5px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40 disabled:pointer-events-none"
              >
                <X className="size-3.5" />
                Reject
              </button>
            </div>
          )}

          {/* Provenance accordion */}
          {data.provenance && (
            <div>
              <button type="button"
                onClick={() => setShowProvenance((v) => !v)}
                className="flex w-full items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground hover:text-foreground"
              >
                <Info className="size-3" />
                Generation provenance
              </button>
              {showProvenance && (
                <div className="mt-2 space-y-1 rounded-lg border border-white/[0.07] bg-black/20 p-2.5 text-[10.5px] text-muted-foreground">
                  <p><span className="text-foreground/60">Model:</span> {data.provenance.modelId}</p>
                  <p><span className="text-foreground/60">Provider:</span> {data.provenance.provider}</p>
                  <p><span className="text-foreground/60">Cost:</span> {data.provenance.estimatedCost} credits</p>
                  <p><span className="text-foreground/60">Style lock:</span> {data.provenance.styleLockVersion}</p>
                  <p><span className="text-foreground/60">Generated:</span> {new Date(data.provenance.generatedAt).toLocaleString()}</p>
                  {data.provenance.characterRefIds.length > 0 && (
                    <p><span className="text-foreground/60">Char refs:</span> {data.provenance.characterRefIds.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{data.provenance ? `${data.provenance.modelId} · ${data.provenance.provider}` : 'No provenance'}</span>
          <StatusDot status={data.status} />
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
