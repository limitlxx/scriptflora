/**
 * Login-with-ChatGPT proxy — mounts the LWC server handler at /api/chatgpt/*.
 * Requires LWC_SECRET env var. All ChatGPT tokens stay server-side.
 */
import { createChatGPTHandler } from '@opencoredev/loginwithchatgpt-server'

const auth = createChatGPTHandler({
  basePath: '/api/chatgpt',
  secret: process.env.LWC_SECRET ?? 'ScriptFlora-local-dev-secret',
  responsesProxy: {
    allowedModels: [
      'gpt-5.5',
      'gpt-5.4',
      'gpt-5.4-mini',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
    ],
  },
})

// Next.js App Router: export named methods that delegate to the LWC handler
export async function GET(request: Request) {
  return auth.handler(request)
}

export async function POST(request: Request) {
  return auth.handler(request)
}

export async function DELETE(request: Request) {
  return auth.handler(request)
}
