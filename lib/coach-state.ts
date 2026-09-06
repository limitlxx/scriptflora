'use client'

/**
 * C1 — Coach state snapshot.
 * Derived from canvas nodes + auth — sent with every coach message.
 */

import type { ScriptFloraNode } from './flow-types'

export type CoachBlocker =
  | 'brief_unconfirmed'
  | 'character_images_missing_before_video'
  | 'no_runway_credits'
  | 'no_director_credits'
  | 'sequence_empty'
  | 'hyperframes_missing_sequence'

export type CoachState = {
  // session
  hasChatGPTLogin: boolean

  // navigation
  route: string

  // brief
  briefStatus: 'empty' | 'draft' | 'generated' | 'confirmed'

  // locks
  characterBiblePresent: boolean
  characterImagesLocked: boolean
  styleLockPresent: boolean

  // skills
  selectedSkillId: string | null
  skillNodesCount: number

  // selected node
  selectedNodeType: string | null
  selectedNodeStatus: string | null

  // production progress
  shotPlanExists: boolean
  approvedShotCount: number
  sequenceClipCount: number
  hyperframesStatus: string | null

  // blockers (derived)
  blockers: CoachBlocker[]
}

/** Derives CoachState from the current canvas node list. */
export function deriveCoachState(
  nodes: ScriptFloraNode[],
  hasChatGPTLogin: boolean,
  route = '/canvas',
): CoachState {
  const briefNode = nodes.find((n) => n.type === 'brief')
  const briefData = briefNode?.type === 'brief' ? briefNode.data : null
  const briefStatus: CoachState['briefStatus'] =
    !briefData ? 'empty'
    : briefData.status === 'approved' ? 'confirmed'
    : (briefData.title || briefData.objective) ? 'draft'
    : 'empty'

  const bibleNode = nodes.find((n) => n.type === 'character-bible')
  const characterBiblePresent = !!bibleNode
  const characterImagesLocked = bibleNode?.type === 'character-bible'
    ? bibleNode.data.characters.some((c) => c.status === 'locked' && c.referenceImageUrl)
    : false

  const styleLockPresent = nodes.some((n) => n.type === 'style-lock')

  const skillNode = nodes.find((n) => n.type === 'skill')
  const selectedSkillId = skillNode?.type === 'skill' ? (skillNode.data.selected ?? null) : null
  const skillNodesCount = nodes.filter((n) => n.type === 'content').length

  const selectedNode = nodes.find((n) => n.selected)
  const selectedNodeType = selectedNode?.type ?? null
  const selectedNodeStatus =
    selectedNode && 'data' in selectedNode && selectedNode.data
      ? (selectedNode.data as { status?: string }).status ?? null
      : null

  const shotPlanExists = nodes.some((n) => n.type === 'shot-list')
  const approvedShotCount = nodes.filter(
    (n) => n.type === 'result' && n.type === 'result' && (n.data as { resultStatus?: string }).resultStatus === 'approved',
  ).length
  const sequenceNode = nodes.find((n) => n.type === 'sequence')
  const sequenceClipCount = sequenceNode?.type === 'sequence'
    ? sequenceNode.data.items.length
    : 0
  const hyperframesNode = nodes.find((n) => n.type === 'hyperframes')
  const hyperframesStatus = hyperframesNode?.type === 'hyperframes'
    ? hyperframesNode.data.hfStatus
    : null

  const blockers: CoachBlocker[] = []
  if (briefStatus !== 'confirmed') blockers.push('brief_unconfirmed')
  if (characterBiblePresent && !characterImagesLocked) blockers.push('character_images_missing_before_video')
  if (hyperframesNode && sequenceClipCount === 0) blockers.push('hyperframes_missing_sequence')

  return {
    hasChatGPTLogin,
    route,
    briefStatus,
    characterBiblePresent,
    characterImagesLocked,
    styleLockPresent,
    selectedSkillId,
    skillNodesCount,
    selectedNodeType,
    selectedNodeStatus,
    shotPlanExists,
    approvedShotCount,
    sequenceClipCount,
    hyperframesStatus,
    blockers,
  }
}

/** One-line summary of canvas state for the system prompt. */
export function coachStateToText(s: CoachState): string {
  return [
    `Route: ${s.route}`,
    `Brief: ${s.briefStatus}`,
    `Character Bible: ${s.characterBiblePresent ? (s.characterImagesLocked ? 'present, images locked' : 'present, images NOT locked') : 'absent'}`,
    `Style Lock: ${s.styleLockPresent ? 'present' : 'absent'}`,
    `Selected skill: ${s.selectedSkillId ?? 'none'}`,
    `Script nodes: ${s.skillNodesCount}`,
    `Selected node: ${s.selectedNodeType ?? 'none'} (${s.selectedNodeStatus ?? '—'})`,
    `Shot plan: ${s.shotPlanExists ? 'yes' : 'no'}, approved shots: ${s.approvedShotCount}`,
    `Sequence clips: ${s.sequenceClipCount}`,
    `HyperFrames: ${s.hyperframesStatus ?? 'none'}`,
    `ChatGPT login: ${s.hasChatGPTLogin ? 'yes' : 'no'}`,
    `Blockers: ${s.blockers.length ? s.blockers.join(', ') : 'none'}`,
  ].join('\n')
}
