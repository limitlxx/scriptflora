/**
 * POST /api/continuity-fix
 *
 * Given a script section and a continuity issue description, returns a
 * corrected version of the section that resolves the issue.
 *
 * Body: { nodeLabel: string, content: string, issue: string, keyFacts: string[] }
 * Response: { fixed: string }
 */
import { createChatGPTProxyProvider } from '@opencoredev/loginwithchatgpt-ai'
import { streamText } from 'ai'
import { auth } from '@/lib/chatgpt-handler'

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as {
    nodeLabel: string
    content: string
    issue: string
    keyFacts: string[]
  } | null

  if (!body?.content || !body.issue) {
    return Response.json({ error: 'content and issue are required' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const proxyFetch = auth.proxyFetch(request)
  const chatgpt = createChatGPTProxyProvider({ basePath: `${origin}/api/chatgpt`, fetch: proxyFetch })

  const keyFactLines = body.keyFacts.length
    ? body.keyFacts.map((f) => `- ${f}`).join('\n')
    : '- None'

  const system = `You are a script editor. Your job is to fix a specific continuity issue in one section of a script.

RULES:
- Address ONLY the stated issue. Do not rewrite unrelated parts.
- Preserve the tone, voice, and structure of the original section.
- Never contradict or omit any key fact.
- Return ONLY the corrected section text. No explanation, no fences.`

  const prompt = `Section: ${body.nodeLabel}
Issue to fix: ${body.issue}
Key facts (must be preserved): 
${keyFactLines}

Original section:
${body.content.slice(0, 3000)}

Return the corrected section text only.`

  try {
    const result = streamText({ model: chatgpt('gpt-5.5'), system, prompt, maxRetries: 1 })
    let text = ''
    for await (const delta of result.textStream) text += delta
    return Response.json({ fixed: text.trim() })
  } catch (err) {
    console.error('[/api/continuity-fix]', err)
    return Response.json({ error: 'Fix failed — try again.' }, { status: 500 })
  }
}
