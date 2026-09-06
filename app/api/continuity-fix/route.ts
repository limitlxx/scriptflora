/**
 * POST /api/continuity-fix
 * Given a specific continuity issue + the full script context, returns a
 * rewritten version of the affected content node that resolves the issue.
 * The caller must confirm before applying — this never mutates silently.
 */
import { createChatGPTProxyProvider } from '@opencoredev/loginwithchatgpt-ai'
import { streamText } from 'ai'
import { auth } from '@/lib/chatgpt-handler'

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const body = await request.json() as {
    issue: { id: string; severity: string; message: string; source: string }
    nodeId: string
    nodeLabel: string
    nodeContent: string
    fullScript: string
    keyFacts: string[]
  }

  const { issue, nodeLabel, nodeContent, fullScript, keyFacts } = body

  const origin = new URL(request.url).origin
  const proxyFetch = auth.proxyFetch(request)
  const chatgpt = createChatGPTProxyProvider({ basePath: `${origin}/api/chatgpt`, fetch: proxyFetch })

  const keyFactLines = keyFacts.length ? keyFacts.map((f) => `- ${f}`).join('\n') : '- None'

  const system = `You are a script continuity editor. Your job is to fix ONE specific continuity issue in a script section.
Rules:
- Rewrite ONLY the provided section to fix the stated issue.
- Preserve the original tone, style, and length as closely as possible.
- Do NOT introduce new characters, locations, or plot elements.
- Honour all key facts.
- Return ONLY the rewritten section text. No explanation, no labels, no JSON.`

  const prompt = `The full script context (do not rewrite this — reference only):
${fullScript.slice(0, 4000)}

Key facts to honour:
${keyFactLines}

Section to fix (label: "${nodeLabel}"):
${nodeContent}

Continuity issue to resolve: ${issue.message}
Source: ${issue.source}

Rewrite the section to fix this issue:`

  try {
    const result = streamText({ model: chatgpt('gpt-5.4-mini'), system, prompt, maxTokens: 800, maxRetries: 1 })
    let text = ''
    for await (const delta of result.textStream) text += delta

    const fixed = text.trim()
    if (!fixed) return Response.json({ error: 'Empty fix response' }, { status: 500 })

    return Response.json({ fixed })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Fix failed'
    return Response.json({ error: msg }, { status: 500 })
  }
}
