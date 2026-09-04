'use client'

import { type NodeProps } from '@xyflow/react'
import { BookMarked, ChevronDown, ChevronUp, Lock, LockOpen, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { nanoid } from 'nanoid'
import { cn } from '@/lib/utils'
import type { ContinuityLogNode as ContinuityLogNodeType, ContinuityLogEntry } from '@/lib/flow-types'
import { useNodeActions } from '@/components/canvas/node-action-context'
import {
  FieldLabel, NodeDivider, NodeFooter, NodeHeader,
  NodeShell, StatusDot, ToolbarButton, ToolbarDivider, fieldClass,
} from './node-shell'

function emptyEntry(label: string): ContinuityLogEntry {
  return {
    id: nanoid(8),
    sceneLabel: label,
    characterStates: '',
    revealedFacts: '',
    openThreads: '',
    wardrobeChanges: '',
  }
}

function LogEntryCard({
  entry,
  index,
  disabled,
  onChange,
  onRemove,
}: {
  entry: ContinuityLogEntry
  index: number
  disabled: boolean
  onChange: (patch: Partial<ContinuityLogEntry>) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(index === 0)

  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/20">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/15 font-mono text-[10px] text-primary">
          {index + 1}
        </span>
        <input
          value={entry.sceneLabel}
          disabled={disabled}
          onChange={(e) => onChange({ sceneLabel: e.target.value })}
          placeholder={`Scene ${index + 1}`}
          className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-foreground/90 outline-none placeholder:text-muted-foreground/50 disabled:cursor-default"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Collapse entry' : 'Expand entry'}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        {!disabled && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove entry"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-2.5 border-t border-white/[0.06] px-3 pb-3 pt-3">
          <label className="block">
            <FieldLabel>Character entry / exit states</FieldLabel>
            <textarea
              value={entry.characterStates}
              disabled={disabled}
              onChange={(e) => onChange({ characterStates: e.target.value })}
              placeholder="Margot: enters alone, exits with Elise. Elise: first appearance."
              rows={2}
              className={cn(fieldClass, 'resize-none')}
            />
          </label>
          <label className="block">
            <FieldLabel>Revealed facts</FieldLabel>
            <textarea
              value={entry.revealedFacts}
              disabled={disabled}
              onChange={(e) => onChange({ revealedFacts: e.target.value })}
              placeholder="Margot shot four hundred weddings. She never looked at the mothers."
              rows={2}
              className={cn(fieldClass, 'resize-none')}
            />
          </label>
          <label className="block">
            <FieldLabel>Open threads</FieldLabel>
            <textarea
              value={entry.openThreads}
              disabled={disabled}
              onChange={(e) => onChange({ openThreads: e.target.value })}
              placeholder="Who is Elise? What is the commission?"
              rows={2}
              className={cn(fieldClass, 'resize-none')}
            />
          </label>
          <label className="block">
            <FieldLabel>Wardrobe changes</FieldLabel>
            <input
              value={entry.wardrobeChanges}
              disabled={disabled}
              onChange={(e) => onChange({ wardrobeChanges: e.target.value })}
              placeholder="Margot adds apron"
              className={fieldClass}
            />
          </label>
        </div>
      )}
    </div>
  )
}

export function ContinuityLogNode({ id, data, selected }: NodeProps<ContinuityLogNodeType>) {
  const { update, act } = useNodeActions()
  const [hovered, setHovered] = useState(false)
  const disabled = Boolean(data.locked)

  const setEntries = (entries: ContinuityLogEntry[]) =>
    update(id, { entries, status: entries.length > 0 ? 'draft' : 'empty' })

  const addEntry = () =>
    setEntries([...(data.entries ?? []), emptyEntry(`Scene ${(data.entries?.length ?? 0) + 1}`)])

  const updateEntry = (idx: number, patch: Partial<ContinuityLogEntry>) => {
    const entries = [...(data.entries ?? [])]
    entries[idx] = { ...entries[idx], ...patch }
    setEntries(entries)
  }

  const removeEntry = (idx: number) =>
    setEntries((data.entries ?? []).filter((_, i) => i !== idx))

  const entryCount = data.entries?.length ?? 0

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
            <ToolbarButton
              icon={data.locked ? LockOpen : Lock}
              label={data.locked ? 'Unlock log' : 'Lock log'}
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
          title="Continuity Log"
          subtitle="Character states &amp; revealed facts per scene"
          right={<StatusDot status={data.status} />}
        />
        <NodeDivider />

        <div className="scroll-slim max-h-[480px] space-y-2 overflow-y-auto px-3 py-3">
          {entryCount === 0 && (
            <p className="py-2 text-center text-[11px] text-muted-foreground">
              Add a scene entry to start tracking continuity.
            </p>
          )}
          {(data.entries ?? []).map((entry, i) => (
            <LogEntryCard
              key={entry.id}
              entry={entry}
              index={i}
              disabled={disabled}
              onChange={(patch) => updateEntry(i, patch)}
              onRemove={() => removeEntry(i)}
            />
          ))}

          {!disabled && (
            <button
              type="button"
              onClick={addEntry}
              className={cn(
                'flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.12] py-2',
                'text-[11.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground',
              )}
            >
              <Plus className="size-3.5" />
              Add scene entry
            </button>
          )}
        </div>

        <NodeDivider />
        <NodeFooter>
          <span>{entryCount} scene{entryCount !== 1 ? 's' : ''} logged</span>
        </NodeFooter>
      </NodeShell>
    </div>
  )
}
