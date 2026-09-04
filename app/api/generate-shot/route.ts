/**
 * POST /api/generate-shot
 * Phase 3 — Runway model router.
 *
 * Routes each shot to the correct Runway model based on the brief,
 * passes locked character refs + style lock, and returns a result
 * with full generation provenance.
 *
 * Runway API docs: https://docs.dev.runwayml.com/
 * ponytail: real video generation requires RUNWAY_API_KEY in .env.local.
 * Without the key the route returns a simulated pending result so the
 * canvas and UI can be exercised without a Runway subscription.
 */
import { nanoid } from 'nanoid'
import type { RunwayModel, ShotGenerationBrief, GenerationProvenance } from '@/lib/flow-types'

const RUNWAY_API_BASE = 'https://api.dev.runwayml.com/v1'

// Model router — mirrors the Phase 3 routing table in the action plan
function routeModel(brief: ShotGenerationBrief): RunwayModel {
  if (brief.isEditOfExistingClip) return 'aleph2'
  if (brief.priority === 'draft') return 'gen4_turbo'
  if (brief.isPerformanceShot) return 'act-two'
  if (brief.needsNativeAudio) return 'veo3.1'
  return 'gen4.5'
}

// Map our internal IDs to Runway's model strings
const RUNWAY_MODEL_MAP: Record<RunwayModel, string> = {
  gen4_turbo: 'gen4_turbo',
  'gen4.5': 'gen4_5',
  'act-two': 'act_two',
  aleph2: 'aleph_2',
  'veo3.1': 'veo_3_1',
}

// Rough credit estimates per model (for cost display)
const CREDIT_ESTIMATE: Record<RunwayModel, number> = {
  gen4_turbo: 5,
  'gen4.5': 10,
  'act-two': 12,
  aleph2: 8,
  'veo3.1': 10,
}

export type GenerateShotRequest = {
  brief: ShotGenerationBrief
  characterRefImages: Array<{ id: string; imageUrl: string; name: string }>
  styleLockSnapshot: string       // JSON string of style lock data
}

export type GenerateShotResponse = {
  taskId: string                  // Runway task ID for polling
  modelId: RunwayModel
  estimatedCost: number
  provenance: GenerationProvenance
  simulated?: boolean             // true when no Runway key is present
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Sign in with ChatGPT first.' }, { status: 401 })
  }

  let body: GenerateShotRequest
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { brief, characterRefImages, styleLockSnapshot } = body
  if (!brief?.shotId) {
    return Response.json({ error: 'brief.shotId is required' }, { status: 400 })
  }

  const modelId = routeModel(brief)
  const estimatedCost = CREDIT_ESTIMATE[modelId]

  const provenance: GenerationProvenance = {
    modelId,
    provider: 'runway',
    brief,
    characterRefIds: brief.characterRefIds,
    styleLockVersion: brief.styleLockVersion,
    continuitySnapshot: styleLockSnapshot,
    estimatedCost,
    generatedAt: new Date().toISOString(),
  }

  // Without a Runway API key — return a simulated pending result
  // so the UI can be fully exercised during development.
  if (!process.env.RUNWAY_API_KEY) {
    return Response.json({
      taskId: `sim-${nanoid(10)}`,
      modelId,
      estimatedCost,
      provenance,
      simulated: true,
    } satisfies GenerateShotResponse)
  }

  // ── Real Runway call ──────────────────────────────────────────────
  // Build prompt from shot brief
  const promptParts = [
    brief.camera,
    brief.action,
    brief.continuityNotes,
    brief.durationTarget && `Duration: ${brief.durationTarget}`,
  ].filter(Boolean).join('. ')

  // First image ref = storyboard frame (if approved), fallback to first character ref
  const firstImage = brief.storyboardImageUrl
    ?? characterRefImages[0]?.imageUrl
    ?? null

  const runwayBody: Record<string, unknown> = {
    model: RUNWAY_MODEL_MAP[modelId],
    promptText: promptParts,
    duration: parseDurationSeconds(brief.durationTarget),
    ratio: '16:9',
    seed: Math.floor(Math.random() * 2 ** 32),
  }

  if (firstImage) {
    runwayBody.promptImage = firstImage
  }

  // Act-Two requires a driving reference (character ref image)
  if (modelId === 'act-two' && characterRefImages[0]?.imageUrl) {
    runwayBody.referenceImages = characterRefImages.slice(0, 2).map((r) => ({
      uri: r.imageUrl,
      tag: r.name,
    }))
  }

  try {
    const res = await fetch(`${RUNWAY_API_BASE}/image_to_video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify(runwayBody),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      console.error('[/api/generate-shot] Runway error:', err)
      return Response.json(
        { error: (err as { message?: string }).message ?? 'Runway generation failed.' },
        { status: res.status },
      )
    }

    const data = await res.json() as { id: string }

    return Response.json({
      taskId: data.id,
      modelId,
      estimatedCost,
      provenance,
    } satisfies GenerateShotResponse)

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    console.error('[/api/generate-shot]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}

// ── Status polling endpoint (GET /api/generate-shot?taskId=…) ────────
export async function GET(request: Request) {
  const taskId = new URL(request.url).searchParams.get('taskId')
  if (!taskId) return Response.json({ error: 'taskId required' }, { status: 400 })

  // Simulated tasks always return succeeded after a short delay
  if (taskId.startsWith('sim-')) {
    return Response.json({
      taskId,
      status: 'SUCCEEDED',
      output: [],   // no real video URL in sim mode
      simulated: true,
    })
  }

  if (!process.env.RUNWAY_API_KEY) {
    return Response.json({ error: 'RUNWAY_API_KEY not configured' }, { status: 500 })
  }

  const res = await fetch(`${RUNWAY_API_BASE}/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
      'X-Runway-Version': '2024-11-06',
    },
  })

  if (!res.ok) {
    return Response.json({ error: 'Failed to fetch task status' }, { status: res.status })
  }

  const data = await res.json()
  return Response.json(data)
}

// ── Helpers ──────────────────────────────────────────────────────────
function parseDurationSeconds(target: string): number {
  // "3–5 seconds" → 4, "5s" → 5, "10 sec" → 10, fallback 5
  const match = target.match(/(\d+)/)
  if (!match) return 5
  const n = parseInt(match[1], 10)
  // Runway accepts 5 or 10 seconds
  return n <= 7 ? 5 : 10
}
