/**
 * POST /api/generate-brief
 * Generates a structured Brief from a freeform idea description.
 * Uses streamText + JSON parse (same pattern as /api/generate).
 */
import { createChatGPTProxyProvider } from '@opencoredev/loginwithchatgpt-ai'
import { streamText } from 'ai'
import { auth } from '@/lib/chatgpt-handler'

export type GenerateBriefRequest = {
  idea: string
  platform?: string
  duration?: string
  audience?: string
}

export type GenerateBriefResult = {
  title: string
  objective: string
  audience: string
  platforms: string[]
  duration: string
  tone: string
  keyFacts: string[]
  additionalNotes: string
  assumptions: string[]   // fields the model inferred rather than extracted
}

const SYSTEM = `You are a professional script producer helping a writer build a creative brief.

Given a freeform idea description, produce a complete, production-ready brief.

RULES:
- Extract facts directly stated by the user. Do not invent statistics, claims, or brand details.
- For fields you must infer (not explicitly stated), include them in the "assumptions" array so the UI can flag them.
- keyFacts must only contain high-confidence items clearly implied or stated by the user. Keep it sparse — max 4 items.
- tone must be one of: cinematic, documentary, conversational, satirical, poetic
- platforms must be an array of strings from: YouTube, Instagram, TikTok, LinkedIn, Twitter / X, Cinema, Broadcast TV, Training / LMS
- duration should be a human-readable string like "60s", "2 min", "5 min"
- assumptions: list each field you inferred (e.g. "tone: assumed cinematic based on dramatic language")
- Return ONLY valid JSON. No markdown fences. No explanation.

JSON SCHEMA:
{
  "title": "string",
  "objective": "string (one sentence)",
  "audience": "string",
  "platforms": ["string"],
  "duration": "string",
  "tone": "cinematic|documentary|conversational|satirical|poetic",
  "keyFacts": ["string"],
  "additionalNotes": "string",
  "assumptions": ["string"]
}`

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Sign in with ChatGPT to generate.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as GenerateBriefRequest | null
  if (!body?.idea?.trim()) {
    return Response.json({ error: 'idea is required' }, { status: 400 })
  }

  const { idea, platform, duration, audience } = body
  const hints = [
    platform && `Platform hint: ${platform}`,
    duration && `Duration hint: ${duration}`,
    audience && `Audience hint: ${audience}`,
  ].filter(Boolean).join('\n')

  const prompt = `Idea: ${idea.trim()}${hints ? `\n\n${hints}` : ''}\n\nGenerate the brief. Return only JSON.`

  const origin = new URL(request.url).origin
  const proxyFetch = auth.proxyFetch(request)
  const chatgpt = createChatGPTProxyProvider({ basePath: `${origin}/api/chatgpt`, fetch: proxyFetch })

  try {
    const result = streamText({ model: chatgpt('gpt-5.4-mini'), system: SYSTEM, prompt, maxRetries: 1 })
    let text = ''
    for await (const delta of result.textStream) text += delta

    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const parsed = JSON.parse(cleaned) as GenerateBriefResult
    return Response.json(parsed)
  } catch (err) {
    console.error('[/api/generate-brief]', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Generation failed' }, { status: 500 })
  }
}
