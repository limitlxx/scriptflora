'use client'

import { type NodeProps } from '@xyflow/react'
import {
  Camera,
  Check,
  Eye,
  ChevronDown,
  ChevronUp,
  WandSparkles,
  Copy,
  Lock,
  LockOpen,
  MessageSquare,
  Milestone,
  RefreshCw,
  Sparkle,
  Target,
  Trash2,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  CONTENT_KIND_META,
  type ContentKind,
  type ContentNode as ContentNodeType,
} from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  NodeDivider,
  NodeFooter,
  NodeHeader,
  NodeShell,
  StatusDot,
  ToolbarButton,
  ToolbarDivider,
} from './node-shell'

const KIND_ICON: Record<ContentKind, React.ComponentType<{ className?: string }>> =
  {
    hook: Zap,
    scene: Milestone,
    dialogue: MessageSquare,
    visual: Camera,
    cta: Target,
    'auteur-stageplay': MessageSquare,
    'auteur-screenplay': Sparkle,
    'auteur-technical': Milestone,
    'auteur-production-summary': Eye,
    'auteur-script': WandSparkles,
  }

export function ContentNode({ id, data, selected }: NodeProps<ContentNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  // Defensive: custom skill stages may produce unknown kind strings
  const meta = CONTENT_KIND_META[data.kind as ContentKind] ?? {
    label: data.label || data.kind || 'Stage',
    hint: 'Custom stage',
    group: 'both' as const,
  }
  const Icon = (KIND_ICON as Record<string, React.ComponentType<{ className?: string }>>)[data.kind] ?? WandSparkles
  const disabled = Boolean(data.locked)
  const generating = data.status === 'generating'

  // grow the editor to fit its content, up to a ceiling
  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 260)}px`
  }, [data.content])

  const words = data.content.trim()
    ? data.content.trim().split(/\s+/).length
    : 0

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeShell
        selected={selected}
        locked={data.locked}
        approved={data.approved}
        status={data.status}
        width={340}
        toolbarVisible={selected || hovered}
        toolbar={
          <>
            <ToolbarButton
              icon={Eye}
              label="Preview result"
              onClick={() => setPreviewOpen(true)}
              disabled={!data.content || generating}
            />
            <ToolbarButton
              icon={RefreshCw}
              label="Regenerate"
              onClick={() => act(id, 'regenerate')}
              disabled={disabled || generating}
              tone="accent"
            />
            <ToolbarButton
              icon={Check}
              label={data.approved ? 'Remove approval' : 'Approve'}
              active={data.approved}
              onClick={() => act(id, data.approved ? 'unapprove' : 'approve')}
              disabled={disabled}
            />
            <ToolbarButton
              icon={data.locked ? LockOpen : Lock}
              label={data.locked ? 'Unlock' : 'Lock'}
              active={data.locked}
              onClick={() => act(id, data.locked ? 'unlock' : 'lock')}
            />
            <ToolbarDivider />
            <ToolbarButton
              icon={Copy}
              label="Duplicate"
              onClick={() => act(id, 'duplicate')}
            />
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
          icon={Icon}
          title={
            <input
              value={data.index != null ? `${data.label} ${data.index}` : (data.label || meta.label)}
              disabled={disabled}
              onChange={(e) => {
                // Strip trailing index number when editing the base label
                const raw = e.target.value
                const stripped = data.index != null
                  ? raw.replace(new RegExp(`\\s*${data.index}$`), '').trim()
                  : raw
                update(id, { label: stripped || meta.label })
              }}
              className="nodrag w-full truncate bg-transparent text-[13px] font-medium leading-tight tracking-[-0.01em] text-foreground outline-none placeholder:text-muted-foreground/50 disabled:cursor-default"
              placeholder={meta.label}
              aria-label="Node title"
            />
          }
          subtitle={meta.hint}
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="px-4 py-3">
          <button
            type="button"
            className="nodrag mb-2 flex w-full items-center justify-between text-left text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setPromptOpen((open) => !open)}
            aria-expanded={promptOpen}
          >
            <span className="flex items-center gap-1.5"><WandSparkles className="size-3 text-primary/80" /> Prompt</span>
            {promptOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
          {promptOpen && (
            <div className="mb-3">
              <textarea
                className="nodrag min-h-16 w-full resize-none rounded-lg border border-white/[0.07] bg-black/20 p-2.5 text-[11px] leading-relaxed text-foreground/85 outline-none placeholder:text-muted-foreground/40 focus:border-primary/35"
                value={data.prompt ?? ''}
                disabled={disabled || generating}
                onChange={(event) => update(id, { prompt: event.target.value })}
                placeholder={`Guide this ${meta.label.toLowerCase()}...`}
                aria-label={`${meta.label} generation prompt`}
              />
              {(data.prompt ?? '').trim() && !disabled && (
                <button
                  type="button"
                  onClick={() => act(id, 'regenerate')}
                  disabled={generating}
                  className={cn(
                    'nodrag mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5',
                    'text-[11px] font-medium transition-all duration-150',
                    'bg-primary/15 text-primary hover:bg-primary/25',
                    'disabled:pointer-events-none disabled:opacity-50',
                  )}
                >
                  <WandSparkles className="size-3" />
                  {generating ? 'Running…' : 'Run prompt'}
                </button>
              )}
            </div>
          )}
          {generating && (
            <div className="mb-3" aria-live="polite">
              <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground"><span>Generating</span><span>{data.progress ?? 0}%</span></div>
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${data.progress ?? 0}%` }} /></div>
            </div>
          )}
          {generating && !data.content ? (
            <div className="space-y-2 py-1" aria-live="polite">
              <span className="sr-only">Generating</span>
              {['92%', '78%', '85%', '54%'].map((w, i) => (
                <span
                  key={w}
                  className="block h-2.5 animate-pulse rounded bg-white/[0.07]"
                  style={{ width: w, animationDelay: `${i * 140}ms` }}
                />
              ))}
            </div>
          ) : (
            <textarea
              ref={areaRef}
              value={data.content}
              disabled={disabled}
              onChange={(e) => {
                update(id, {
                  content: e.target.value,
                  status: data.approved ? data.status : 'draft',
                })
              }}
              placeholder={`Write or generate the ${meta.label.toLowerCase()}…`}
              className={cn(
                'nodrag scroll-slim w-full resize-none border-none bg-transparent p-0',
                'text-foreground/90 text-[12.5px] leading-[1.65] tracking-[-0.005em]',
                'placeholder:text-muted-foreground/50 outline-none',
                'disabled:cursor-not-allowed',
              )}
              style={{ minHeight: 72 }}
            />
          )}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span className="flex items-center gap-2">
            {data.approved && (
              <span className="text-success flex items-center gap-1">
                <Check className="size-2.5" />
                Approved
              </span>
            )}
            {data.locked && !data.approved && <span>Locked from edits</span>}
            {!data.approved && !data.locked && <span>{words} words</span>}
          </span>
          {data.tokens != null && (
            <span className="font-mono tracking-tight">
              {data.tokens.toLocaleString()} tok
            </span>
          )}
        </NodeFooter>
      </NodeShell>
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => setPreviewOpen(false)}>
          <section className="nodrag relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[0.1] bg-background p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby={`preview-title-${id}`} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground" onClick={() => setPreviewOpen(false)} aria-label="Close preview">×</button>
            <div className="mb-5 flex items-center gap-3 text-muted-foreground"><Icon className="size-4 text-primary" /><span className="text-[10px] font-medium uppercase tracking-[0.16em]">Result preview</span></div>
            <h2 id={`preview-title-${id}`} className="mb-5 pr-8 font-serif text-2xl leading-tight text-foreground">{data.label || meta.label}{data.index != null ? ` ${data.index}` : ''}</h2>
            <p className="whitespace-pre-wrap text-[14px] leading-7 text-foreground/85">{data.content}</p>
            <div className="mt-8 flex items-center justify-between border-t border-white/[0.07] pt-4 text-[10px] text-muted-foreground"><span>{words} words</span><span>{data.tokens?.toLocaleString() ?? 0} tok</span></div>
          </section>
        </div>
      )}
    </div>
  )
}
