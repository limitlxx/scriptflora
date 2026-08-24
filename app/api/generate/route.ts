/**
 * POST /api/generate
 *
 * Server-side generation using the user's ChatGPT session.
 * Auth: checks the lwc_session HttpOnly cookie set by /api/chatgpt/*.
 * Uses proxyFetch via the shared auth handler to keep tokens server-side.
 */
import { createChatGPTHandler } from '@opencoredev/loginwithchatgpt-server'
import { createChatGPTProxyProvider } from '@opencoredev/loginwithchatgpt-ai'
import { generateText } from 'ai'
import { nanoid } from 'nanoid'
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { GenerationRequest, GenerationPlan } from '@/lib/flow-types'

// Shared handler — same secret as the auth route so sessions are readable
const auth = createChatGPTHandler({
  basePath: '/api/chatgpt',
  secret: process.env.LWC_SECRET ?? 'ScriptFlora-local-dev-secret',
})

export async function POST(request: Request) {
  // Check session cookie directly — avoids the shared-store problem with
  // separate handler instances. The cookie value is signed with LWC_SECRET.
  const cookieHeader = request.headers.get('cookie') ?? ''
  const hasSession = cookieHeader.includes('lwc_session=')

  if (process.env.LWC_SECRET && !hasSession) {
    return Response.json({ error: 'Sign in with ChatGPT to generate.' }, { status: 401 })
  }

  let body: GenerationRequest
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { brief, skill, existingContent, model, fast, reasoningEffort } = body
  if (!brief || !skill) {
    return Response.json({ error: 'brief and skill are required' }, { status: 400 })
  }

  let skillMarkdown = body.skillMarkdown ?? ''
  if (!skillMarkdown) {
    const skillFile = skill === 'auteur' ? 'auteur-script.md' : 'standard-script.md'
    try {
      skillMarkdown = await readFile(join(process.cwd(), 'public', 'skills', skillFile), 'utf-8')
    } catch {
      return Response.json({ error: 'Skill file not found' }, { status: 500 })
    }
  }

  // proxyFetch reads the session cookie and forwards it to the ChatGPT proxy
  const proxyFetch = auth.proxyFetch(request)
  const chatgpt = createChatGPTProxyProvider({ basePath: '/api/chatgpt', fetch: proxyFetch })

  const keyFactLines =
    brief.keyFacts?.filter(Boolean).map((f) => `- ${f}`).join('\n') || '- None'
  const lockedLines = Object.keys(existingContent ?? {}).length
    ? Object.entries(existingContent)
        .map(([k, v]) => `[${k}]: ${String(v).slice(0, 120)}`)
        .join('\n')
    : 'None'

  const systemPrompt = `You are a professional scriptwriter. Generate structured script content following the skill methodology EXACTLY.

--- SKILL ---
${skillMarkdown}
--- END SKILL ---

RULES:
- Follow the Node Mapping in the skill file exactly.
- Standard Script: hook×1, then per scene beat: scene + dialogue + visual (×N scaled with duration), then cta×1.
- Auteur Script: exactly 5 stages in order: auteur-stageplay, auteur-screenplay, auteur-technical, auteur-production-summary, auteur-script.
- Never contradict or omit any key fact.
- Preserve locked content verbatim.
- stageKey format: "skillId:kind" or "skillId:kind:index" — e.g. "standard:hook", "standard:scene:1", "auteur:auteur-stageplay".
- Return ONLY a valid JSON object — no markdown fences, no extra text.

JSON SCHEMA:
{
  "stages": [
    {
      "kind": "string",
      "index": "number (only for repeatable stages)",
      "stageKey": "string",
      "label": "string",
      "content": "string"
    }
  ]
}`

  const userPrompt = `Title: ${brief.title}
Objective: ${brief.objective}
Audience: ${brief.audience}
Platforms: ${brief.platforms?.join(', ') || 'Not specified'}
Duration: ${brief.duration}
Tone: ${brief.tone}
Key Facts:
${keyFactLines}
Additional Notes: ${brief.additionalNotes || 'None'}
Skill: ${skill}
Locked content to preserve verbatim:
${lockedLines}

Generate the complete script. Return only JSON.`

  try {
    const { text } = await generateText({
      model: chatgpt(model ?? 'gpt-5.5'),
      system: systemPrompt,
      prompt: userPrompt,
      maxRetries: 2,
      headers: {
        ...(fast ? { 'x-login-with-chatgpt-service-tier': 'fast' } : {}),
        ...(reasoningEffort ? { 'x-login-with-chatgpt-reasoning-effort': reasoningEffort } : {}),
      },
    })

    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned) as { stages: GenerationPlan['stages'] }
    if (!Array.isArray(parsed.stages)) throw new Error('Invalid plan shape')

    return Response.json({ stages: parsed.stages, generationId: nanoid(10) } satisfies GenerationPlan)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    console.error('[/api/generate]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
