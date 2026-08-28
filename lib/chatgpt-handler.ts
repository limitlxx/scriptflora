/**
 * Single shared createChatGPTHandler instance.
 * Both the auth route and the generate route must use the SAME secret so
 * session cookies signed by /api/chatgpt/* can be read by /api/generate.
 */
import { createChatGPTHandler } from '@opencoredev/loginwithchatgpt-server'

export const auth = createChatGPTHandler({
  basePath: '/api/chatgpt',
  // Falls back to a stable dev value so the app starts without .env.local,
  // but real deployments must set LWC_SECRET.
  secret: process.env.LWC_SECRET ?? 'ScriptFlora-dev-secret-change-me',
  responsesProxy: {
    allowedModels: ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini'],
  },
})
