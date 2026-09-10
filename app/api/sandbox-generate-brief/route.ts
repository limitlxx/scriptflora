/**
 * POST /api/sandbox-generate-brief
 * Unauthenticated version of /api/generate-brief for the landing sandbox.
 * Uses SANDBOX_OPENAI_KEY, falls back to SANDBOX_GROQ_KEY on any OpenAI error.
 * ponytail: Groq exposes an OpenAI-compatible endpoint — createOpenAI with a
 * custom baseURL is all we need, no new package.
 */
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const SYSTEM = `You are a professional script producer helping a writer build a creative brief.

Given a freeform idea description, produce a complete, production-ready brief.

RULES:
- Extract facts directly stated by the user. Do not invent statistics, claims, or brand details.
- For fields you must infer (not explicitly stated), include them in the "assumptions" array.
- keyFacts must only contain high-confidence items clearly implied or stated by the user. Keep it sparse — max 4 items.
- tone must be one of: cinematic, documentary, conversational, satirical, poetic
- platforms must be an array of strings from: YouTube, Instagram, TikTok, LinkedIn, Twitter / X, Cinema, Broadcast TV
- duration should be a human-readable string like "60s", "2 min", "5 min"
- Return ONLY valid JSON. No markdown fences. No explanation. No extra text.

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

/**
 * Extract JSON from raw model output.
 * Handles: <think>…</think> reasoning blocks, markdown fences, leading prose.
 */
function extractJson(raw: string): string {
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  const start = text.indexOf('{')
  if (start === -1) throw new Error('No JSON object found in response')

  // Walk forward counting depth to find exact closing '}' — strips trailing prose
  let depth = 0, inStr = false, end = -1
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\\' && inStr) { i++; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (ch === '{') depth++
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break } }
  }
  if (end !== -1) return text.slice(start, end + 1)

  // Truncated — repair open brackets
  let json = text.slice(start)
  if (json.match(/^[\s\S]*"(?:[^"\\]|\\.)*$/)) json += '"'
  const stack: string[] = []
  inStr = false
  for (let i = 0; i < json.length; i++) {
    const ch = json[i]
    if (ch === '\\' && inStr) { i++; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (ch === '{') stack.push('}')
    else if (ch === '[') stack.push(']')
    else if (ch === '}' || ch === ']') stack.pop()
  }
  return json + stack.reverse().join('')
}

export async function POST(request: Request) {
  const openaiKey = process.env.SANDBOX_OPENAI_KEY
  const groqKey = process.env.SANDBOX_GROQ_KEY
  if (!openaiKey && !groqKey) {
    return Response.json({ error: 'Sandbox not configured.' }, { status: 503 })
  }

  const body = await request.json().catch(() => null) as {
    idea?: string; platform?: string; duration?: string; audience?: string
  } | null
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

  const providers: Array<{ client: ReturnType<typeof createOpenAI>; model: string; name: string }> = []
  if (openaiKey) {
    providers.push({ client: createOpenAI({ apiKey: openaiKey }), model: 'gpt-4o-mini', name: 'openai' })
  }
  if (groqKey) {
    providers.push({
      client: createOpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' }),
      model: 'openai/gpt-oss-20b',
      name: 'groq',
    })
  }

  let lastErr: unknown
  // ponytail: single attempt per provider — no retry loop that burns Groq OTPM quota
  for (const { client, model, name } of providers) {
    try {
      const { text } = await generateText({
        model: client(model),
        system: SYSTEM,
        prompt,
        maxTokens: 900,
        maxRetries: 0,
      })
      if (!text.trim()) throw new Error('Empty response from model.')
      const jsonStr = extractJson(text)
      return Response.json(JSON.parse(jsonStr))
    } catch (err) {
      console.warn(`[/api/sandbox-generate-brief] ${name} failed:`, err instanceof Error ? err.message : err)
      lastErr = err
    }
  }

  console.error('[/api/sandbox-generate-brief] all providers failed')
  return Response.json({ error: lastErr instanceof Error ? lastErr.message : 'Generation failed' }, { status: 500 })
}
