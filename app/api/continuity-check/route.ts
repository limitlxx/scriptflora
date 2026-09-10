/**
 * POST /api/continuity-check
 * Runs a fast consistency check on the script using the LWC proxy.
 */
import { createChatGPTProxyProvider } from '@opencoredev/loginwithchatgpt-ai'
import { streamText } from 'ai'
import { auth } from '@/lib/chatgpt-handler'

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const { script, keyFacts } = await request.json() as { script: string; keyFacts: string[] }

  const origin = new URL(request.url).origin
  const proxyFetch = auth.proxyFetch(request)
  const chatgpt = createChatGPTProxyProvider({ basePath: `${origin}/api/chatgpt`, fetch: proxyFetch })

  const system = `You are a script continuity editor. Analyse the provided script for consistency issues.
Return ONLY valid JSON — no fences, no explanation.
Schema: {"score":number,"issues":[{"id":"string","severity":"error"|"warning"|"info","message":"string","source":"string"}]}
- score: 0–100 (100 = perfect consistency)
- severity: error = breaks the story/facts, warning = possible issue, info = suggestion
- source: the section name where the issue was found
- Keep issues concise and actionable. Maximum 8 issues.`

  const prompt = `Key facts (MUST be honoured):\n${keyFacts.length ? keyFacts.map((f) => `- ${f}`).join('\n') : '- None'}\n\nScript:\n${script.slice(0, 6000)}`

  try {
    const result = streamText({ model: chatgpt('gpt-5.5'), system, prompt, maxRetries: 1 })
    let text = ''
    for await (const delta of result.textStream) text += delta

    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const parsed = JSON.parse(cleaned) as { score: number; issues: unknown[] }
    return Response.json(parsed)
  } catch (err) {
    console.error('[/api/continuity-check]', err)
    // Return a neutral result rather than an error so the node still updates
    return Response.json({ score: 80, issues: [{ id: 'check-failed', severity: 'info', message: 'AI check unavailable — review manually.', source: 'system' }] })
  }
}
