'use client'

import { type NodeProps } from '@xyflow/react'
import {
  Check, Lock, LockOpen, MessageCircle, Plus, Trash2, Users, X,
} from 'lucide-react'
import { useState } from 'react'
import { nanoid } from 'nanoid'
import { cn } from '@/lib/utils'
import type { TeamWorkspaceNode as TeamWorkspaceNodeType, TeamComment } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'

export function TeamWorkspaceNode({ id, data, selected }: NodeProps<TeamWorkspaceNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const [newAuthor, setNewAuthor] = useState('')
  const [newText, setNewText] = useState('')
  const disabled = Boolean(data.locked)

  const comments = data.comments ?? []

  const addComment = () => {
    if (!newText.trim()) return
    const comment: TeamComment = {
      id: nanoid(8),
      author: newAuthor.trim() || 'Anonymous',
      text: newText.trim(),
      resolved: false,
      createdAt: new Date().toISOString(),
    }
    update(id, { comments: [...comments, comment], status: 'draft' })
    setNewText('')
  }

  const toggleResolved = (idx: number) => {
    update(id, {
      comments: comments.map((c, i) => i === idx ? { ...c, resolved: !c.resolved } : c),
    })
  }

  const removeComment = (idx: number) =>
    update(id, { comments: comments.filter((_, i) => i !== idx) })

  const openCount = comments.filter((c) => !c.resolved).length

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <NodeShell
        selected={selected}
        locked={data.locked}
        status={data.status}
        width={400}
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
          icon={Users}
          title="Team Workspace"
          subtitle="Comments, approvals, brand kit"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="space-y-3.5 px-4 py-3.5">
          {/* Workspace name */}
          <label className="block">
            <FieldLabel>Workspace name</FieldLabel>
            <input value={data.workspaceName} disabled={disabled}
              onChange={(e) => update(id, { workspaceName: e.target.value })}
              placeholder="Acme Films — Season 2" className={fieldClass} />
          </label>

          {/* Brand kit */}
          <label className="block">
            <FieldLabel>Brand kit notes</FieldLabel>
            <textarea value={data.brandKitNotes} disabled={disabled} rows={3}
              onChange={(e) => update(id, { brandKitNotes: e.target.value })}
              placeholder="Colours: #1A2B3C, #FF6B00. Font: Helvetica Neue. Tone: confident, warm. No jargon."
              className={cn(fieldClass, 'resize-none')} />
          </label>

          {/* Approval required toggle */}
          <button type="button" disabled={disabled}
            aria-pressed={data.approvalRequired}
            onClick={() => update(id, { approvalRequired: !data.approvalRequired })}
            className="nodrag flex w-full items-center gap-2 text-left focus-visible:outline-none disabled:pointer-events-none">
            <span className={cn(
              'flex size-3.5 items-center justify-center rounded border transition-all',
              data.approvalRequired ? 'border-primary bg-primary' : 'border-white/20',
            )}>
              {data.approvalRequired && <Check className="size-2.5 text-primary-foreground" />}
            </span>
            <span className="text-[11.5px] text-muted-foreground">Team approval required before export</span>
          </button>

          {/* Comments */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <FieldLabel>Comments</FieldLabel>
              {openCount > 0 && (
                <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[9px] font-medium text-warning/90">
                  {openCount} open
                </span>
              )}
            </div>

            {/* Comment list */}
            {comments.length > 0 && (
              <div className="scroll-slim mb-2 max-h-[200px] space-y-1.5 overflow-y-auto">
                {comments.map((c, i) => (
                  <div key={c.id} className={cn(
                    'flex gap-2 rounded-xl border px-3 py-2 transition-all',
                    c.resolved ? 'border-white/[0.05] bg-black/10 opacity-60' : 'border-white/[0.08] bg-black/20',
                  )}>
                    <MessageCircle className="mt-0.5 size-3 shrink-0 text-muted-foreground/60" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-foreground/60">{c.author}</p>
                      <p className={cn('text-[11.5px] leading-snug', c.resolved ? 'line-through text-muted-foreground/50' : 'text-foreground/85')}>
                        {c.text}
                      </p>
                      <p className="mt-0.5 text-[9.5px] text-muted-foreground/40">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!disabled && (
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <button type="button" onClick={() => toggleResolved(i)}
                          title={c.resolved ? 'Re-open' : 'Resolve'}
                          className={cn('flex size-5 items-center justify-center rounded text-[11px] transition-colors',
                            c.resolved ? 'text-muted-foreground/30 hover:text-foreground' : 'text-success/60 hover:text-success')}>
                          <Check className="size-2.5" />
                        </button>
                        <button type="button" onClick={() => removeComment(i)} aria-label="Delete comment"
                          className="flex size-5 items-center justify-center rounded text-muted-foreground/20 hover:text-destructive">
                          <X className="size-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            {!disabled && (
              <div className="space-y-1.5">
                <input value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Your name (optional)"
                  className={cn(fieldClass, 'text-[11px]')} />
                <div className="flex gap-2">
                  <textarea value={newText} onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') addComment() }}
                    placeholder="Add a comment… (⌘Enter to submit)"
                    rows={2} className={cn(fieldClass, 'flex-1 resize-none text-[11px]')} />
                  <button type="button" onClick={addComment} disabled={!newText.trim()}
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-30 disabled:pointer-events-none transition-colors">
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{data.workspaceName || 'Unnamed workspace'}</span>
          <span className="font-mono text-[10px]">{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
