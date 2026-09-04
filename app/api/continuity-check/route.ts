/**
 * POST /api/continuity-check
 * Runs a fast consistency check on the script using the LWC proxy.
 * Phase 0: now accepts full brief context so the AI can check tone,
 * audience, and platform alignment in addition to key facts.
 */
import { createChatGPTProxyProvider } from '@opencoredev/loginwithchatgpt-ai'
import { streamText } from 'ai'
import { auth } from '@/lib/chatgpt-handler'

type BriefContext = {
  title?: string
  objective?: string
  audience?: string
  tone?: string
  platforms?: string[]
  duration?: string
} | null

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const body = await request.json() as { script: string; keyFacts: string[]; brief?: BriefContext }
  const { script, keyFacts, brief } = body

  const origin = new URL(request.url).origin
  const proxyFetch = auth.proxyFetch(request)
  const chatgpt = createChatGPTProxyProvider({ basePath: `${origin}/api/chatgpt`, fetch: proxyFetch })

  // Build brief summary for the prompt when available
  const briefLines = brief
    ? [
        brief.title && `Title: ${brief.title}`,
        brief.objective && `Objective: ${brief.objective}`,
        brief.audience && `Audience: ${brief.audience}`,
        brief.tone && `Tone: ${brief.tone}`,
        brief.platforms?.length && `Platforms: ${brief.platforms.join(', ')}`,
        brief.duration && `Duration: ${brief.duration}`,
      ].filter(Boolean).join('\n')
    : null

  const system = `You are a script continuity editor. Analyse the provided script for consistency issues.
Return ONLY valid JSON — no fences, no explanation.
Schema: {"score":number,"issues":[{"id":"string","severity":"error"|"warning"|"info","message":"string","source":"string"}]}
- score: 0–100 (100 = perfect consistency)
- severity: error = breaks the story/facts, warning = possible issue, info = suggestion
- source: the section name where the issue was found
- Check against key facts, brief objectives, tone, and audience
- Keep issues concise and actionable. Maximum 8 issues.`

  const keyFactsText = keyFacts.length ? keyFacts.map((f) => `- ${f}`).join('\n') : '- None'
  const prompt = [
    briefLines && `Brief context:\n${briefLines}`,
    `Key facts (MUST be honoured):\n${keyFactsText}`,
    `Script:\n${script.slice(0, 6000)}`,
  ].filter(Boolean).join('\n\n')

  try {
    const result = streamText({ model: chatgpt('gpt-5.4-mini'), system, prompt, maxRetries: 1 })
    let text = ''
    for await (const delta of result.textStream) text += delta

    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed: { score: number; issues: unknown[] }
    try {
      parsed = JSON.parse(cleaned) as { score: number; issues: unknown[] }
    } catch {
      console.error('[/api/continuity-check] JSON parse failed:', cleaned.slice(0, 200))
      return Response.json({ score: 80, issues: [{ id: 'parse-failed', severity: 'info', message: 'AI check returned unexpected format — review manually.', source: 'system' }] })
    }

    return Response.json(parsed)
  } catch (err) {
    console.error('[/api/continuity-check]', err)
    return Response.json({ score: 80, issues: [{ id: 'check-failed', severity: 'info', message: 'AI check unavailable — review manually.', source: 'system' }] })
  }
}
