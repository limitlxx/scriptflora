/**
 * POST /api/generate
 *
 * The ChatGPT Codex proxy (login-with-chatgpt) requires:
 *   1. stream: true  →  use streamText, not generateText
 *   2. gpt-5.x models only (gpt-4o / gpt-4o-mini are rejected)
 *
 * Long-form support: the request body may include `chunkIndex` and
 * `chunkTotal` to generate one chunk of a large script at a time.
 * The caller is responsible for merging all chunks into a full plan.
 * This sidesteps output-token limits for 2-hour feature films.
 */
import { createChatGPTProxyProvider } from '@opencoredev/loginwithchatgpt-ai'
import { streamText } from 'ai'
import { nanoid } from 'nanoid'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { auth } from '@/lib/chatgpt-handler'
import type { GenerationRequest, GenerationPlan } from '@/lib/flow-types'
import { trimToSetWindow } from '@/lib/utils'

// Only models supported by the ChatGPT Codex endpoint
const SUPPORTED_MODELS = ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.3-codex-spark'] as const
type SupportedModel = (typeof SUPPORTED_MODELS)[number]

function resolveModel(requested: string): SupportedModel {
  if (SUPPORTED_MODELS.includes(requested as SupportedModel)) return requested as SupportedModel
  return 'gpt-5.5'
}

/**
 * Parse a human duration string into total minutes.
 * e.g. "2 hours", "90 min", "120s", "feature (2hr)" → number
 */
function parseDurationMinutes(duration: string): number {
  const s = duration.toLowerCase()
  const hrMatch = s.match(/(\d+(?:\.\d+)?)\s*h/)
  if (hrMatch) return Math.round(parseFloat(hrMatch[1]) * 60)
  const minMatch = s.match(/(\d+(?:\.\d+)?)\s*m/)
  if (minMatch) return Math.round(parseFloat(minMatch[1]))
  const secMatch = s.match(/(\d+)\s*s/)
  if (secMatch) return Math.round(parseInt(secMatch[1]) / 60)
  return 0
}

/**
 * How many scene beats a given duration warrants.
 * Standard skill guideline: ~1 beat per 2-3 minutes for short form,
 * ~1 beat per 5-8 minutes for long form (movie).
 * ponytail: ceiling 60 beats — beyond that chunk the generation.
 */
function sceneCountForDuration(minutes: number): number {
  if (minutes <= 0) return 4  // default short-form
  if (minutes < 2) return Math.max(2, Math.round(minutes * 60 / 15))  // seconds-based
  if (minutes <= 5) return Math.round(minutes * 1.5)
  if (minutes <= 30) return Math.round(minutes / 3)
  if (minutes <= 90) return Math.round(minutes / 5)
  return Math.round(minutes / 8)  // feature film
}

/** Split a large scene list into chunks of at most maxPerChunk scenes each. */
function buildChunks(totalScenes: number, maxPerChunk = 8): Array<{ start: number; end: number }> {
  const chunks: Array<{ start: number; end: number }> = []
  for (let i = 0; i < totalScenes; i += maxPerChunk) {
    chunks.push({ start: i + 1, end: Math.min(i + maxPerChunk, totalScenes) })
  }
  return chunks
}

async function callModel(
  chatgpt: ReturnType<typeof createChatGPTProxyProvider>,
  model: SupportedModel,
  system: string,
  prompt: string,
  extraHeaders: Record<string, string>,
): Promise<string> {
  const result = streamText({ model: chatgpt(model), system, prompt, maxRetries: 1, headers: extraHeaders })
  let text = ''
  for await (const delta of result.textStream) text += delta
  return text
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Sign in with ChatGPT to generate.' }, { status: 401 })
  }

  let body: GenerationRequest & { chunkIndex?: number; chunkTotal?: number; totalScenes?: number }
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
    const fileMap: Record<string, string> = {
      auteur: 'auteur-script.md',
      series: 'series-script.md',
    }
    const file = fileMap[skill] ?? 'standard-script.md'
    try {
      skillMarkdown = await readFile(join(process.cwd(), 'public', 'skills', file), 'utf-8')
    } catch {
      return Response.json({ error: 'Skill file not found' }, { status: 500 })
    }
  }

  const origin = new URL(request.url).origin
  const proxyFetch = auth.proxyFetch(request)
  const chatgpt = createChatGPTProxyProvider({ basePath: `${origin}/api/chatgpt`, fetch: proxyFetch })

  const extraHeaders: Record<string, string> = {
    'x-login-with-chatgpt-reasoning-effort': reasoningEffort,
  }
  if (serviceTier) extraHeaders['x-login-with-chatgpt-service-tier'] = serviceTier

  const keyFactLines = brief.keyFacts?.filter(Boolean).map((f) => `- ${f}`).join('\n') || '- None'
  const lockedLines = Object.keys(existingContent ?? {}).length
    ? Object.entries(existingContent).map(([k, v]) => `[${k}]: ${String(v).slice(0, 120)}`).join('\n')
    : 'None'

  // ── Long-form detection ───────────────────────────────────────────────────
  // If the duration implies a long-form project (>10 min) and the caller
  // hasn't already specified a chunk, we return the generation PLAN first:
  // { needsChunking: true, totalScenes, chunks } so the client can drive
  // multi-call generation. Each subsequent call passes chunkIndex/chunkTotal.
  const durationMinutes = parseDurationMinutes(brief.duration ?? '')
  const isLongForm = durationMinutes > 10 && skill !== 'auteur'

  // Explicit chunk request — generate only the requested chunk
  const chunkIndex = body.chunkIndex ?? null
  const chunkTotal = body.chunkTotal ?? null

  if (isLongForm && chunkIndex === null) {
    // Return a chunking plan — client will call us once per chunk
    const totalScenes = body.totalScenes ?? sceneCountForDuration(durationMinutes)
    const chunks = buildChunks(totalScenes)
    return Response.json({
      needsChunking: true,
      totalScenes,
      durationMinutes,
      chunks,
      generationId: nanoid(10),
    })
  }

  // ── System prompt ─────────────────────────────────────────────────────────
  const chunkNote = chunkIndex !== null && chunkTotal !== null
    ? `\nYou are generating CHUNK ${chunkIndex} of ${chunkTotal}. Generate only the scenes for this chunk — do not generate the hook or CTA (those are in chunk 1 and the final chunk respectively). Scene indices start at ${body.totalScenes ? Math.round(((chunkIndex - 1) / chunkTotal) * body.totalScenes) + 1 : 1}.`
    : ''

  const system = `You are a professional scriptwriter. Generate structured script content following the skill methodology EXACTLY.${chunkNote}

--- SKILL ---
${skillMarkdown}
--- END SKILL ---

RULES:
- Follow the Node Mapping in the skill exactly.
- Standard Script: hook×1, then per beat scene + dialogue + visual (×N scaled with duration), then cta×1.
- Series Script: hook×1, scene×1 (episode outline), dialogue×N (act beats), visual×1 (visual notes), cta×1 (episode close).
- Auteur Script: exactly 5 stages in order: auteur-stageplay, auteur-screenplay, auteur-technical, auteur-production-summary, auteur-script.
- Never contradict or omit any key fact.
- Preserve locked content verbatim.
- stageKey format: "skillId:kind" or "skillId:kind:index" — e.g. "standard:hook", "standard:scene:1", "series:dialogue:2", "auteur:auteur-stageplay".
- Return ONLY valid JSON. No markdown fences. No extra text.

JSON SCHEMA:
{"stages":[{"kind":"string","index":"number (repeatable stages only)","stageKey":"string","label":"string","content":"string"}]}`

  const prompt = `Title: ${brief.title}
Objective: ${brief.objective}
Audience: ${brief.audience}
Platforms: ${brief.platforms?.join(', ') || 'Not specified'}
Duration: ${brief.duration}
Tone: ${brief.tone}
Key Facts:
${keyFactLines}
Notes: ${brief.additionalNotes || 'None'}
Skill: ${skill}
Locked (preserve verbatim): ${lockedLines}
Generate the complete script. Return only JSON.`

  try {
    const text = await callModel(chatgpt, model, system, prompt, extraHeaders)

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

    // Set-by-set: trim each stage to the target generation window
    const secondsPerSet = brief.secondsPerSet
    if (brief.generationMode === 'set-by-set' && secondsPerSet && secondsPerSet > 0) {
      for (const stage of parsed.stages) {
        stage.content = trimToSetWindow(stage.content, secondsPerSet)
      }
    }

    return Response.json({ stages: parsed.stages, generationId: nanoid(10) } satisfies GenerationPlan)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    if (message.includes('401') || message.includes('Unauthorized') || message.includes('session')) {
      return Response.json({ error: 'Session expired. Sign in with ChatGPT again.' }, { status: 401 })
    }
    console.error('[/api/generate]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
