/**
 * POST /api/continuity/apply-patch
 *
 * Phase 8 — all continuity mutations from skill nodes must go through here.
 * This is the single chokepoint: marketplace skills cannot free-form mutate
 * continuity state — they call this endpoint which validates and logs the patch.
 *
 * Today the patch is validated and echoed back; the canvas applies it client-side.
 * When server-side continuity persistence is added (Phase 6), this is where it lands.
 */
import type { ContinuityPatch } from '@/lib/flow-types'

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  let patch: ContinuityPatch
  try {
    patch = await request.json() as ContinuityPatch
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate required fields
  if (!patch.sourceNodeId || !patch.skillId || !patch.skillVersion) {
    return Response.json(
      { error: 'sourceNodeId, skillId, and skillVersion are required' },
      { status: 422 },
    )
  }

  // ponytail: server is the authority on what a valid patch looks like.
  // Sanitise arrays — reject anything that isn't a string array.
  const safe: ContinuityPatch = {
    sourceNodeId: String(patch.sourceNodeId),
    skillId: String(patch.skillId),
    skillVersion: String(patch.skillVersion),
    characterStates: toStringRecord(patch.characterStates),
    revealedFacts: toStringArray(patch.revealedFacts),
    openThreads: toStringArray(patch.openThreads),
  }

  // TODO Phase 6: persist to project continuity log in the DB here.
  // For now, echo the sanitised patch back so the canvas can apply it.

  return Response.json({ ok: true, patch: safe })
}

function toStringArray(val: unknown): string[] | undefined {
  if (!Array.isArray(val)) return undefined
  return val.filter((v) => typeof v === 'string')
}

function toStringRecord(val: unknown): Record<string, string> | undefined {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return undefined
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v
  }
  return Object.keys(out).length > 0 ? out : undefined
}
