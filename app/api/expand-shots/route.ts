/**
 * POST /api/expand-shots
 * Phase 2 — Shot-layer Director.
 * Takes an approved script node's content and expands it into an ordered
 * shot / macro-state list with generation briefs per shot.
 */
import { createChatGPTProxyProvider } from '@opencoredev/loginwithchatgpt-ai'
import { streamText } from 'ai'
import { nanoid } from 'nanoid'
import { auth } from '@/lib/chatgpt-handler'
import type { Shot } from '@/lib/flow-types'

export type ExpandShotsRequest = {
  sceneContent: string      // the script text to expand
  sceneLabel: string        // e.g. "Scene 1"
  brief: {
    title: string
    duration: string
    tone: string
    keyFacts: string[]
  }
  characters?: Array<{ name: string; role: string; visualDescription: string }>
  styleLock?: { medium: string; visualRules: string; hardConstraints: string }
}

export type ExpandShotsResult = {
  shots: Omit<Shot, 'id' | 'status' | 'storyboardImageUrl' | 'sourceNodeId'>[]
}

const SYSTEM = `You are a film director breaking a script scene into individual shots.

For each shot produce a clear, actionable brief that a video model can execute.

RULES:
- Keep shots short: 3–8 seconds each. Prefer more shots over longer shots.
- Each shot has one clear subject and one clear action.
- dialogue is empty string if no spoken lines in that shot.
- openingState / endingState describe the world + character status at the cut boundary.
- durationTarget is a human string like "4–6 seconds".
- label is short and descriptive: "Shot N — [subject + action]".
- Return ONLY valid JSON. No fences. No explanation.

JSON SCHEMA:
{"shots":[{
  "index":number,
  "label":"string",
  "camera":"string",
  "action":"string",
  "dialogue":"string",
  "continuityNotes":"string",
  "openingState":"string",
  "endingState":"string",
  "durationTarget":"string"
}]}`

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Sign in with ChatGPT to expand shots.' }, { status: 401 })
  }

  let body: ExpandShotsRequest
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.sceneContent?.trim()) {
    return Response.json({ error: 'sceneContent is required' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const proxyFetch = auth.proxyFetch(request)
  const chatgpt = createChatGPTProxyProvider({ basePath: `${origin}/api/chatgpt`, fetch: proxyFetch })

  const keyFactLines = body.brief.keyFacts?.filter(Boolean).map((f) => `- ${f}`).join('\n') || '- None'

  const charLines = body.characters?.length
    ? body.characters.map((c) => `- ${c.name} (${c.role}): ${c.visualDescription}`).join('\n')
    : 'None'

  const styleLine = body.styleLock
    ? `Medium: ${body.styleLock.medium}. Rules: ${body.styleLock.visualRules}. NEVER: ${body.styleLock.hardConstraints}`
    : 'Not specified'

  const prompt = `Project: ${body.brief.title}
Duration hint: ${body.brief.duration}
Tone: ${body.brief.tone}
Key facts: ${keyFactLines}
Characters: ${charLines}
Style: ${styleLine}

Scene: ${body.sceneLabel}
---
${body.sceneContent.trim()}
---

Break this scene into individual shots. Return only JSON.`

  try {
    const result = streamText({ model: chatgpt('gpt-5.4-mini'), system: SYSTEM, prompt, maxRetries: 1 })
    let text = ''
    for await (const delta of result.textStream) text += delta

    if (!text.trim()) {
      return Response.json({ error: 'Empty response — session may have expired.' }, { status: 401 })
    }

    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed: ExpandShotsResult
    try {
      parsed = JSON.parse(cleaned) as ExpandShotsResult
    } catch {
      console.error('[/api/expand-shots] JSON parse failed:', cleaned.slice(0, 200))
      return Response.json({ error: 'Model returned invalid JSON. Try again.' }, { status: 500 })
    }

    if (!Array.isArray(parsed.shots)) {
      return Response.json({ error: 'Invalid response shape.' }, { status: 500 })
    }

    // Stamp IDs — client doesn't need to generate them
    const shots: Shot[] = parsed.shots.map((s) => ({
      ...s,
      id: nanoid(8),
      status: 'pending' as const,
    }))

    return Response.json({ shots })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Expansion failed'
    if (message.includes('401') || message.includes('Unauthorized') || message.includes('session')) {
      return Response.json({ error: 'Session expired. Sign in with ChatGPT again.' }, { status: 401 })
    }
    console.error('[/api/expand-shots]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
