/**
 * POST /api/generate-reference-image  — submit tasks, return task IDs
 * GET  /api/generate-reference-image?taskIds=id1,id2  — poll status
 *
 * Split into two calls so the route never blocks for >5s.
 * Client submits → gets task IDs → polls until all SUCCEEDED.
 */

const BASE = 'https://api.dev.runwayml.com/v1'
const VER  = '2024-11-06'
const MODEL = 'gen4_image_turbo'

function runwayHeaders(apiKey: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, 'X-Runway-Version': VER }
}

// ── POST — submit tasks ───────────────────────────────────────────────────────
export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Sign in with ChatGPT first.' }, { status: 401 })
  }

  const body = await request.json() as {
    prompt: string
    type: 'character' | 'style'
    count?: number
    sourceImage?: string
  }

  const { prompt, type, count = 2, sourceImage } = body
  if (!prompt?.trim()) return Response.json({ error: 'prompt is required' }, { status: 400 })

  const n = Math.min(Math.max(count, 1), 4)

  const enrichedPrompt = type === 'character'
    ? `Character reference sheet. ${prompt}. Front and three-quarter view. Neutral studio background. Cinematic lighting. Production-ready.`
    : `Visual mood board. ${prompt}. Cinematic film aesthetic. Rich colour, atmospheric lighting.`

  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) {
    // Simulation — return fake task IDs the GET handler will resolve immediately
    const simIds = Array.from({ length: n }, (_, i) => `sim-${i}-${Date.now()}`)
    return Response.json({ taskIds: simIds, simulated: true })
  }

  const refImages: Array<{ uri: string; tag?: string }> = []
  if (sourceImage) {
    refImages.push(type === 'character' ? { uri: sourceImage, tag: 'subject' } : { uri: sourceImage })
  }

  const payload: Record<string, unknown> = { model: MODEL, promptText: enrichedPrompt, ratio: '1024:1024' }
  if (refImages.length > 0) payload.referenceImages = refImages

  try {
    // Submit all tasks in parallel
    const results = await Promise.all(
      Array.from({ length: n }, async () => {
        const res = await fetch(`${BASE}/text_to_image`, {
          method: 'POST',
          headers: runwayHeaders(apiKey),
          body: JSON.stringify(payload),
        })
        const text = await res.text()
        if (!res.ok) throw new Error(`Runway submit ${res.status}: ${text.slice(0, 200)}`)
        return (JSON.parse(text) as { id: string }).id
      })
    )
    return Response.json({ taskIds: results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Submit failed'
    console.error('[generate-reference-image POST]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}

// ── GET — poll tasks ──────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const taskIds = new URL(request.url).searchParams.get('taskIds')?.split(',').filter(Boolean) ?? []
  if (taskIds.length === 0) return Response.json({ error: 'taskIds required' }, { status: 400 })

  // Simulation — return placeholder images immediately
  if (taskIds[0].startsWith('sim-')) {
    const images = taskIds.map((id) => {
      const i = parseInt(id.split('-')[1] ?? '0')
      return `https://placehold.co/512x512/1a1a2e/a78bfa?text=Variant+${i + 1}`
    })
    return Response.json({ done: true, images, simulated: true })
  }

  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) return Response.json({ error: 'RUNWAY_API_KEY not set' }, { status: 500 })

  try {
    const statuses = await Promise.all(
      taskIds.map(async (id) => {
        const res = await fetch(`${BASE}/tasks/${id}`, {
          headers: { Authorization: `Bearer ${apiKey}`, 'X-Runway-Version': VER },
        })
        if (!res.ok) throw new Error(`Poll ${id} error ${res.status}`)
        return res.json() as Promise<{ id: string; status: string; output?: string[]; failure?: string }>
      })
    )

    const done = statuses.every((t) => t.status === 'SUCCEEDED' || t.status === 'FAILED' || t.status === 'CANCELLED')
    const failed = statuses.find((t) => t.status === 'FAILED' || t.status === 'CANCELLED')

    if (failed) {
      return Response.json({ done: true, error: failed.failure ?? `Task ${failed.status}` })
    }

    if (done) {
      const images = statuses.map((t) => t.output?.[0] ?? '').filter(Boolean)
      return Response.json({ done: true, images })
    }

    // Still running — return progress
    return Response.json({ done: false, statuses: statuses.map((t) => ({ id: t.id, status: t.status })) })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Poll failed'
    console.error('[generate-reference-image GET]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
