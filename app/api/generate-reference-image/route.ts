/**
 * POST /api/generate-reference-image
 *
 * Generates reference images (character sheet / style mood board).
 * Uses OpenAI Images API (gpt-image-1) proxied through the LWC session.
 *
 * Body:
 *   prompt       – text description for the image
 *   type         – 'character' | 'style'
 *   count        – number of variants (1–4, default 2)
 *   sourceImage  – optional base64 data URL to use as reference (image-to-image)
 */

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Sign in with ChatGPT first.' }, { status: 401 })
  }

  const body = await request.json() as {
    prompt: string
    type: 'character' | 'style'
    count?: number
    sourceImage?: string   // base64 data URL
  }

  const { prompt, type, count = 2, sourceImage } = body
  if (!prompt?.trim()) return Response.json({ error: 'prompt is required' }, { status: 400 })

  const n = Math.min(Math.max(count, 1), 4)

  // Build a rich system prompt for the image
  const imagePrompt = type === 'character'
    ? `Character reference sheet. ${prompt}. Front and three-quarter view on neutral background. Cinematic lighting. Clear facial features. Production-ready reference.`
    : `Visual mood board / style reference. ${prompt}. Film production stills aesthetic. Rich color, atmospheric lighting.`

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // Simulate with placeholder images so the UI works without a key
    const placeholders = Array.from({ length: n }, (_, i) => ({
      url: `https://placehold.co/512x512/1a1a2e/a78bfa?text=${encodeURIComponent(type === 'character' ? `Variant ${i + 1}` : `Style ${i + 1}`)}`,
    }))
    return Response.json({ images: placeholders.map((p) => p.url) })
  }

  try {
    if (sourceImage) {
      // Image-to-image: use edits endpoint with the source image as reference
      const base64 = sourceImage.replace(/^data:image\/\w+;base64,/, '')
      const imageBytes = Buffer.from(base64, 'base64')
      const blob = new Blob([imageBytes], { type: 'image/png' })

      const form = new FormData()
      form.append('image', blob, 'reference.png')
      form.append('prompt', imagePrompt)
      form.append('n', String(n))
      form.append('size', '1024x1024')
      form.append('model', 'gpt-image-1')

      const res = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { data: Array<{ url?: string; b64_json?: string }> }
      const images = data.data.map((d) =>
        d.url ?? (d.b64_json ? `data:image/png;base64,${d.b64_json}` : ''),
      ).filter(Boolean)
      return Response.json({ images })
    }

    // Text-to-image
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-image-1', prompt: imagePrompt, n, size: '1024x1024' }),
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json() as { data: Array<{ url?: string; b64_json?: string }> }
    const images = data.data.map((d) =>
      d.url ?? (d.b64_json ? `data:image/png;base64,${d.b64_json}` : ''),
    ).filter(Boolean)
    return Response.json({ images })
  } catch (err) {
    console.error('[/api/generate-reference-image]', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Image generation failed' }, { status: 500 })
  }
}
