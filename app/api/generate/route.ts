/**
 * POST /api/generate
 *
 * The ChatGPT Codex proxy (login-with-chatgpt) requires:
 *   1. stream: true  →  use streamText, not generateText
 *   2. gpt-5.x models only (gpt-4o / gpt-4o-mini are rejected)
 */
import { createChatGPTProxyProvider } from '@opencoredev/loginwithchatgpt-ai'
import { streamText } from 'ai'
import { nanoid } from 'nanoid'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { auth } from '@/lib/chatgpt-handler'
import type { GenerationRequest, GenerationPlan } from '@/lib/flow-types'

// Only models supported by the ChatGPT Codex endpoint
const SUPPORTED_MODELS = ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini'] as const
type SupportedModel = (typeof SUPPORTED_MODELS)[number]

function resolveModel(requested: string): SupportedModel {
  if (SUPPORTED_MODELS.includes(requested as SupportedModel)) {
    return requested as SupportedModel
  }
  // Fallback: map gpt-4o variants to closest supported model
  return 'gpt-5.4-mini'
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Sign in with ChatGPT to generate.' }, { status: 401 })
  }

  let body: GenerationRequest
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { brief, skill, existingContent } = body
  if (!brief || !skill) {
    return Response.json({ error: 'brief and skill are required' }, { status: 400 })
  }

  const model = resolveModel(request.headers.get('x-sf-model') ?? '')
  const serviceTier = request.headers.get('x-sf-service-tier') || undefined
  const reasoningEffort = request.headers.get('x-sf-reasoning-effort') || 'medium'

  let skillMarkdown = body.skillMarkdown ?? ''
  if (!skillMarkdown) {
    const file = skill === 'auteur' ? 'auteur-script.md' : 'standard-script.md'
    try {
      skillMarkdown = await readFile(join(process.cwd(), 'public', 'skills', file), 'utf-8')
    } catch {
      return Response.json({ error: 'Skill file not found' }, { status: 500 })
    }
  }

  // Absolute base URL required in Route Handlers (no document origin)
  const origin = new URL(request.url).origin
  const proxyFetch = auth.proxyFetch(request)
  const chatgpt = createChatGPTProxyProvider({ basePath: `${origin}/api/chatgpt`, fetch: proxyFetch })

  const keyFactLines = brief.keyFacts?.filter(Boolean).map((f) => `- ${f}`).join('\n') || '- None'
  const lockedLines = Object.keys(existingContent ?? {}).length
    ? Object.entries(existingContent).map(([k, v]) => `[${k}]: ${String(v).slice(0, 120)}`).join('\n')
    : 'None'

  const system = `You are a professional scriptwriter. Generate structured script content following the skill methodology EXACTLY.

--- SKILL ---
${skillMarkdown}
--- END SKILL ---

RULES:
- Follow the Node Mapping in the skill exactly.
- Standard Script: hook×1, then per beat scene + dialogue + visual (×N scaled with duration), then cta×1.
- Auteur Script: exactly 5 stages in order: auteur-stageplay, auteur-screenplay, auteur-technical, auteur-production-summary, auteur-script.
- Never contradict or omit any key fact.
- Preserve locked content verbatim.
- stageKey: "skillId:kind" or "skillId:kind:index" e.g. "standard:hook", "standard:scene:1", "auteur:auteur-stageplay".
- Return ONLY valid JSON. No markdown fences. No extra text.

JSON SCHEMA:
{"stages":[{"kind":"string","index":"number (repeatable stages only)","stageKey":"string","label":"string","content":"string"}]}`

  const prompt = `Title: ${brief.title}
Objective: ${brief.objective}
Audience: ${brief.audience}
Platforms: ${brief.platforms?.join(', ') || 'Not specified'}
Duration: ${brief.duration}
Tone: ${brief.tone}
Key Facts: ${keyFactLines}
Notes: ${brief.additionalNotes || 'None'}
Skill: ${skill}
Locked (preserve verbatim): ${lockedLines}
Generate the complete script. Return only JSON.`

  const extraHeaders: Record<string, string> = {
    'x-login-with-chatgpt-reasoning-effort': reasoningEffort,
  }
  if (serviceTier) extraHeaders['x-login-with-chatgpt-service-tier'] = serviceTier

  try {
    // streamText — Codex proxy requires stream:true
    const result = streamText({
      model: chatgpt(model),
      system,
      prompt,
      maxRetries: 1,
      headers: extraHeaders,
    })

    // Collect full streamed text
    let text = ''
    for await (const delta of result.textStream) {
      text += delta
    }

    if (!text.trim()) {
      return Response.json({ error: 'Empty response from model. Your session may have expired — sign in again.' }, { status: 401 })
    }

    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed: { stages: GenerationPlan['stages'] }
    try {
      parsed = JSON.parse(cleaned) as { stages: GenerationPlan['stages'] }
    } catch {
      console.error('[/api/generate] JSON parse failed. Raw text:', cleaned.slice(0, 200))
      return Response.json({ error: 'Model returned invalid JSON. Try again.' }, { status: 500 })
    }

    if (!Array.isArray(parsed.stages)) throw new Error('Invalid plan shape')

    return Response.json({ stages: parsed.stages, generationId: nanoid(10) } satisfies GenerationPlan)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    // Surface session expiry clearly
    if (message.includes('401') || message.includes('Unauthorized') || message.includes('session')) {
      return Response.json({ error: 'Session expired. Sign in with ChatGPT again.' }, { status: 401 })
    }
    console.error('[/api/generate]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
