/**
 * POST /api/generate-reference-image
 *
 * Generates reference images (character sheet / style mood board)
 * using Runway Gen-4 Image via POST /v1/text_to_image.
 *
 * Async: submits a task, polls until SUCCEEDED/FAILED, returns image URLs.
 *
 * Body:
 *   prompt       – text description
 *   type         – 'character' | 'style'
 *   count        – variants (1–4, default 2). Runway doesn't support batch
 *                  natively so we fire N parallel tasks.
 *   sourceImage  – optional base64 data URL used as a reference image
 *
 * Requires: RUNWAY_API_KEY in .env.local
 * Without the key: returns placeholder images so the UI works in dev.
 */

const RUNWAY_API_BASE = 'https://api.dev.runwayml.com/v1'
const RUNWAY_VERSION = '2024-11-06'
// gen4_image_turbo is faster and cheaper; swap to gen4_image for higher quality
const IMAGE_MODEL = 'gen4_image_turbo'
const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 90_000

type RunwayTaskStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'

interface RunwayTask {
  id: string
  status: RunwayTaskStatus
  output?: string[]
  failure?: string
  failureCode?: string
}

async function submitImageTask(
  promptText: string,
  referenceImages: Array<{ uri: string; tag?: string }>,
  apiKey: string,
): Promise<string> {
  const body: Record<string, unknown> = {
    model: IMAGE_MODEL,
    promptText,
    ratio: '1024:1024',
  }
  if (referenceImages.length > 0) {
    body.referenceImages = referenceImages
  }

  const res = await fetch(`${RUNWAY_API_BASE}/text_to_image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-Runway-Version': RUNWAY_VERSION,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message?: string }).message ?? `Runway error ${res.status}`)
  }

  const data = await res.json() as { id: string }
  return data.id
}

async function pollTask(taskId: string, apiKey: string): Promise<string> {
  const deadline = Date.now() + POLL_TIMEOUT_MS

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))

    const res = await fetch(`${RUNWAY_API_BASE}/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-Runway-Version': RUNWAY_VERSION,
      },
    })

    if (!res.ok) throw new Error(`Poll error ${res.status}`)
    const task = await res.json() as RunwayTask

    if (task.status === 'SUCCEEDED') {
      const url = task.output?.[0]
      if (!url) throw new Error('Task succeeded but no output URL')
      return url
    }

    if (task.status === 'FAILED' || task.status === 'CANCELLED') {
      throw new Error(task.failure ?? `Task ${task.status.toLowerCase()}`)
    }
    // PENDING or RUNNING — keep polling
  }

  throw new Error('Image generation timed out — try again')
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Sign in with ChatGPT first.' }, { status: 401 })
  }

  const body = await request.json() as {
    prompt: string
    type: 'character' | 'style'
    count?: number
    sourceImage?: string  // base64 data URL
  }

  const { prompt, type, count = 2, sourceImage } = body
  if (!prompt?.trim()) return Response.json({ error: 'prompt is required' }, { status: 400 })

  const n = Math.min(Math.max(count, 1), 4)

  // Enrich the prompt for the specific use case
  const enrichedPrompt = type === 'character'
    ? `Character reference sheet. ${prompt}. Front and 3/4 view. Neutral studio background. Cinematic lighting. Clear facial features. Production-ready.`
    : `Visual mood board. ${prompt}. Cinematic film production aesthetic. Rich colour, atmospheric lighting. Single coherent frame.`

  const apiKey = process.env.RUNWAY_API_KEY

  // ── Simulation (no API key) ───────────────────────────────────────────────
  if (!apiKey) {
    const placeholders = Array.from({ length: n }, (_, i) =>
      `https://placehold.co/512x512/1a1a2e/a78bfa?text=${encodeURIComponent(
        type === 'character' ? `Character ${i + 1}` : `Style ${i + 1}`,
      )}`,
    )
    return Response.json({ images: placeholders, simulated: true })
  }

  // ── Real Runway call ──────────────────────────────────────────────────────
  // Build reference images array. If a source image is provided, pass it
  // as the first reference (untagged = style influence; tagged = subject anchor).
  const refImages: Array<{ uri: string; tag?: string }> = []
  if (sourceImage) {
    // For characters: tag the source so the model anchors on the subject
    if (type === 'character') {
      refImages.push({ uri: sourceImage, tag: 'subject' })
    } else {
      refImages.push({ uri: sourceImage })  // untagged = style influence
    }
  }

  try {
    // Submit N tasks in parallel
    const taskIds = await Promise.all(
      Array.from({ length: n }, () => submitImageTask(enrichedPrompt, refImages, apiKey)),
    )

    // Poll all tasks in parallel
    const imageUrls = await Promise.all(taskIds.map((id) => pollTask(id, apiKey)))

    return Response.json({ images: imageUrls })
  } catch (err) {
    console.error('[/api/generate-reference-image]', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Image generation failed' },
      { status: 500 },
    )
  }
}
