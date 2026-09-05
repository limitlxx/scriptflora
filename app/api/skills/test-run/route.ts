/**
 * POST /api/skills/test-run
 * Phase S1 — Skills Studio sandbox execution.
 *
 * Runs the skill against a test Brief in an ephemeral context.
 * All outputs are marked `origin: "test"` and NEVER persisted to real projects.
 * Continuity Log is read-only in test context — no patches are written.
 *
 * Returns the GenerationPlan so the Studio test runner can preview spawned nodes.
 */
import { createChatGPTProxyProvider } from '@opencoredev/loginwithchatgpt-ai'
import { streamText } from 'ai'
import { nanoid } from 'nanoid'
import { auth } from '@/lib/chatgpt-handler'
import type { GenerationPlan, BriefNodeData, SkillNodeRecipe } from '@/lib/flow-types'

export type TestRunRequest = {
  /** The skill's Director instructions (system prompt) */
  instructions: string
  /** The skill's declared node recipe */
  nodes: SkillNodeRecipe[]
  /** Test brief — user provides this in Studio before running */
  brief: Pick<BriefNodeData, 'title' | 'objective' | 'audience' | 'duration' | 'tone' | 'keyFacts'>
  skillId: string
  skillVersion: string
}

export type TestRunResponse = {
  plan: GenerationPlan
  /** All nodes are marked origin: test — never persisted to real projects */
  originTag: 'test'
  executedAt: string
}

const SUPPORTED_MODELS = ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini'] as const

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Sign in with ChatGPT to run a test.' }, { status: 401 })
  }

  let body: TestRunRequest
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { instructions, nodes, brief, skillId, skillVersion } = body
  if (!instructions?.trim()) return Response.json({ error: 'instructions are required' }, { status: 400 })
  if (!brief?.title && !brief?.objective) return Response.json({ error: 'Test brief needs at least a title or objective' }, { status: 400 })

  // Build node mapping from recipe
  const nodeMapping = nodes.map((n) => `- ${n.key} (type: ${n.kind ?? n.type}${n.dependsOn?.length ? `, depends: ${n.dependsOn.join(', ')}` : ''})`).join('\n') || '- scene (×N)'

  const system = `You are a professional scriptwriter executing a skill pipeline.

--- SKILL INSTRUCTIONS ---
${instructions.trim()}
--- END SKILL INSTRUCTIONS ---

RULES:
- This is a TEST RUN in an isolated sandbox. No continuity log is written.
- Follow the skill instructions and the node recipe exactly.
- Never contradict or omit any key fact from the brief.
- stageKey format: "skillId:kind" or "skillId:kind:index"
- Return ONLY valid JSON. No markdown fences. No extra text.

NODE RECIPE:
${nodeMapping}

JSON SCHEMA:
{"stages":[{"kind":"string","index":"number (repeatable only)","stageKey":"string","label":"string","content":"string"}]}`

  const keyFactLines = (brief.keyFacts ?? []).filter(Boolean).map((f) => `- ${f}`).join('\n') || '- None'

  const prompt = `TEST RUN — Skill: ${skillId} v${skillVersion}

Title: ${brief.title}
Objective: ${brief.objective}
Audience: ${brief.audience ?? 'Not specified'}
Duration: ${brief.duration ?? 'Not specified'}
Tone: ${brief.tone ?? 'cinematic'}
Key Facts: ${keyFactLines}

Generate the skill output. Return only JSON.`

  const origin = new URL(request.url).origin
  const proxyFetch = auth.proxyFetch(request)
  const chatgpt = createChatGPTProxyProvider({ basePath: `${origin}/api/chatgpt`, fetch: proxyFetch })

  try {
    const result = streamText({
      model: chatgpt('gpt-5.4-mini'),
      system,
      prompt,
      maxRetries: 1,
    })

    let text = ''
    for await (const delta of result.textStream) text += delta

    if (!text.trim()) {
      return Response.json({ error: 'Empty response — session may have expired.' }, { status: 401 })
    }

    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed: { stages: GenerationPlan['stages'] }
    try {
      parsed = JSON.parse(cleaned) as { stages: GenerationPlan['stages'] }
    } catch {
      console.error('[/api/skills/test-run] JSON parse failed:', cleaned.slice(0, 200))
      return Response.json({ error: 'Skill returned invalid JSON. Check instructions and recipe.' }, { status: 500 })
    }

    if (!Array.isArray(parsed.stages)) {
      return Response.json({ error: 'Skill output missing stages array.' }, { status: 500 })
    }

    const plan: GenerationPlan = {
      stages: parsed.stages,
      generationId: nanoid(10),
    }

    return Response.json({
      plan,
      originTag: 'test',
      executedAt: new Date().toISOString(),
    } satisfies TestRunResponse)

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Test run failed'
    if (message.includes('401') || message.includes('session')) {
      return Response.json({ error: 'Session expired. Sign in with ChatGPT again.' }, { status: 401 })
    }
    console.error('[/api/skills/test-run]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
