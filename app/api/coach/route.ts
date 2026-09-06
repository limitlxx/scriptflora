/**
 * POST /api/coach
 * Streaming coach chat endpoint.
 * Uses the same LWC proxy pattern as /api/generate.
 */
import { readFile } from 'fs/promises'
import path from 'path'
import { createChatGPTProxyProvider } from '@opencoredev/loginwithchatgpt-ai'
import { streamText } from 'ai'
import { auth } from '@/lib/chatgpt-handler'

const DOC_FILES = [
  'director-method.md',
  'nodes-reference.md',
  'skills-guide.md',
  'gates-and-blockers.md',
  'hyperframes-guide.md',
]

// Cache at module level — docs don't change at runtime
let cachedDocs: string | null = null

async function getDocs(): Promise<string> {
  if (cachedDocs) return cachedDocs
  const dir = path.join(process.cwd(), 'public', 'coach-docs')
  const parts = await Promise.all(
    DOC_FILES.map(async (f) => {
      try {
        const text = await readFile(path.join(dir, f), 'utf8')
        return `### ${f.replace('.md', '').replace(/-/g, ' ')}\n\n${text}`
      } catch {
        return ''
      }
    }),
  )
  cachedDocs = parts.filter(Boolean).join('\n\n---\n\n')
  return cachedDocs
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Sign in with ChatGPT to use Coach.' }, { status: 401 })
  }

  let body: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    state: string
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const docs = await getDocs()

  const systemPrompt = `You are ScriptFlora Coach — a calm, precise production mentor embedded in the ScriptFlora canvas.

## Your role
Teach the Director Method: Brief → locks → skills → shots → checkpoint → sequence → package.
You are grounded in the product docs below. Never invent features that aren't documented.
You are NOT a generic AI assistant. Stay on ScriptFlora and film production.

## Tone
Film-native, short, actionable. Use terms: Brief, scene, lock, checkpoint, continuity, shot, package, skill.
No hype. No "amazing". Default reply shape:
1. Answer in 1–2 sentences.
2. One concrete next step.
3. Optional: name the control or node to act on.

## Safety rules
- Never suggest bypassing Confirm Brief or Checkpoint gates.
- Never claim video generation is free on the Free plan.
- Never suggest skipping character image locks before video generation.
- Never spend credits without explicit user confirmation.
- If canvas state is unclear, ask one precise clarifying question.

## Current canvas state
${body.state}

## Product documentation
${docs}`

  const origin = new URL(request.url).origin
  const proxyFetch = auth.proxyFetch(request)
  const chatgpt = createChatGPTProxyProvider({
    basePath: `${origin}/api/chatgpt`,
    fetch: proxyFetch,
  })

  try {
    const result = streamText({
      model: chatgpt('gpt-5.4-mini'),
      system: systemPrompt,
      messages: body.messages,
      maxTokens: 512,
    })

    // Collect full response — same pattern as /api/generate
    let text = ''
    for await (const delta of result.textStream) {
      text += delta
    }

    if (!text.trim()) {
      return Response.json({ error: 'Session expired — sign in again.' }, { status: 401 })
    }

    return Response.json({ content: text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Coach unavailable'
    if (msg.includes('401') || msg.includes('session')) {
      return Response.json({ error: 'Session expired — sign in again.' }, { status: 401 })
    }
    return Response.json({ error: msg }, { status: 500 })
  }
}
