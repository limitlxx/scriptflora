/**
 * POST /api/sandbox-generate
 * Unauthenticated version of /api/generate for the landing sandbox.
 * Uses SANDBOX_OPENAI_KEY, falls back to SANDBOX_GROQ_KEY on any OpenAI error.
 * ponytail: Groq exposes an OpenAI-compatible endpoint — createOpenAI with a
 * custom baseURL, no new package needed.
 */
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { nanoid } from 'nanoid'
import type { GenerationRequest, GenerationPlan } from '@/lib/flow-types'

// Keep system prompts minimal — large prompts cause reasoning models to burn
// their entire token budget on <think> blocks, leaving nothing for output.
const SYSTEM_STANDARD = `You are a scriptwriter. Output ONLY a JSON object — no prose, no markdown, no thinking tags.

Schema: {"stages":[{"kind":"hook"|"scene"|"dialogue"|"visual"|"cta","index":number|undefined,"stageKey":"standard:kind"|"standard:kind:N","label":"string","content":"string"}]}

Rules:
- hook×1, scene+dialogue+visual per beat (2-3 beats), cta×1
- stageKey examples: "standard:hook", "standard:scene:1", "standard:dialogue:1", "standard:visual:1", "standard:cta"
- Each content field: 2-3 sentences max
- NO text outside the JSON object`

const SYSTEM_AUTEUR = `You are a scriptwriter. Output ONLY a JSON object — no prose, no markdown, no thinking tags.

Schema: {"stages":[{"kind":"auteur-stageplay"|"auteur-screenplay"|"auteur-technical"|"auteur-production-summary"|"auteur-script","stageKey":"auteur:kind","label":"string","content":"string"}]}

Rules:
- Exactly 5 stages in this order: auteur-stageplay, auteur-screenplay, auteur-technical, auteur-production-summary, auteur-script
- stageKey examples: "auteur:auteur-stageplay", "auteur:auteur-screenplay", "auteur:auteur-technical", "auteur:auteur-production-summary", "auteur:auteur-script"
- Each content field: 2-4 sentences max
- NO text outside the JSON object`

/**
 * Extract and repair JSON from raw model output.
 * Handles <think>…</think> blocks, markdown fences, trailing prose, truncated output.
 */
function extractJson(raw: string): string {
  // Strip reasoning blocks
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  // Strip markdown fences
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  const start = text.indexOf('{')
  if (start === -1) throw new Error(`No JSON in response. Got: ${raw.slice(0, 120)}`)

  // Walk forward from '{' counting nesting depth to find the exact closing '}'
  // This correctly handles trailing prose after the JSON object.
  let depth = 0
  let inStr = false
  let end = -1
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\\' && inStr) { i++; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }

  // If we found a balanced close, use it (strips trailing garbage)
  if (end !== -1) return text.slice(start, end + 1)

  // Truncated — object never closed, repair by closing open brackets
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

  let body: GenerationRequest
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { brief, skill } = body
  if (!brief || !skill) {
    return Response.json({ error: 'brief and skill are required' }, { status: 400 })
  }

  const keyFactLines = brief.keyFacts?.filter(Boolean).map((f) => `- ${f}`).join('\n') || '- None'

  const system = skill === 'auteur' ? SYSTEM_AUTEUR : SYSTEM_STANDARD

  // Keep prompt short — reasoning models burn tokens on long inputs
  const prompt = skill === 'auteur'
    ? `Write a ${brief.tone || 'cinematic'} auteur script using the 5-stage Stageplay→Screenplay→Technical→Production Summary→Auteur Script funnel.
Title: ${brief.title || 'Untitled'}
Goal: ${brief.objective || 'Engage the audience'}
Audience: ${brief.audience || 'General'}
Duration: ${brief.duration || '60s'}
Key facts: ${keyFactLines}
Return only the JSON object.`
    : `Write a ${brief.duration || '60s'} ${brief.tone || 'cinematic'} script.
Title: ${brief.title || 'Untitled'}
Goal: ${brief.objective || 'Engage the audience'}
Audience: ${brief.audience || 'General'}
Key facts: ${keyFactLines}
Return only the JSON object.`

  const providers: Array<{ client: ReturnType<typeof createOpenAI>; model: string; name: string; maxTokens: number }> = []
  if (openaiKey) {
    providers.push({ client: createOpenAI({ apiKey: openaiKey }), model: 'gpt-4o-mini', name: 'openai', maxTokens: 1500 })
  }
  if (groqKey) {
    providers.push({
      client: createOpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' }),
      model: 'openai/gpt-oss-20b',
      name: 'groq',
      maxTokens: 1500,
    })
  }

  let lastErr: unknown
  for (const { client, model, name, maxTokens } of providers) {
    try {
      const { text } = await generateText({
        model: client(model),
        system,
        prompt,
        maxTokens,
        maxRetries: 0,
      })

      console.info(`[sandbox-generate] ${name} raw length: ${text.length}, preview: ${text.slice(0, 80)}`)

      if (!text.trim()) throw new Error('Empty response from model.')

      const jsonStr = extractJson(text)
      const parsed = JSON.parse(jsonStr) as { stages: GenerationPlan['stages'] }
      if (!Array.isArray(parsed.stages)) throw new Error('Invalid plan shape')
      return Response.json({ stages: parsed.stages, generationId: nanoid(10) } satisfies GenerationPlan)
    } catch (err) {
      console.warn(`[sandbox-generate] ${name} failed:`, err instanceof Error ? err.message : err)
      lastErr = err
    }
  }

  return Response.json({ error: lastErr instanceof Error ? lastErr.message : 'Generation failed' }, { status: 500 })
}
