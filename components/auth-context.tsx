'use client'

/**
 * Single LWC session check for the whole app.
 * Both AuthButton and TopBar read from this context instead of each
 * calling useLoginWithChatGPT separately (which would fire two /session requests).
 */
import { useLoginWithChatGPT, type UseLoginWithChatGPTResult } from '@opencoredev/loginwithchatgpt-react'
import { createContext, useContext, type ReactNode } from 'react'

const AuthContext = createContext<UseLoginWithChatGPTResult | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useLoginWithChatGPT({ basePath: '/api/chatgpt' })
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuth(): UseLoginWithChatGPTResult {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
