'use client'

import { createContext, useContext } from 'react'
import type { NodeAction } from '@/lib/flow-types'

export type NodeActionContextValue = {
  /** Shallow-merge a patch into a node's data. */
  update: (id: string, patch: Record<string, unknown>) => void
  /** Fire a node-level command handled by the canvas. */
  act: (id: string, action: NodeAction) => void
}

const NodeActionContext = createContext<NodeActionContextValue | null>(null)

export const NodeActionProvider = NodeActionContext.Provider

export function useNodeActions(): NodeActionContextValue {
  const ctx = useContext(NodeActionContext)
  if (!ctx) {
    throw new Error('useNodeActions must be used within a NodeActionProvider')
  }
  return ctx
}
