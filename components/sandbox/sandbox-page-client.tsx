'use client'

import { openLoginWithChatGPTConsentPopup } from '@opencoredev/loginwithchatgpt-react'
import { useAuth } from '@/components/auth-context'
import { SandboxWizard } from './sandbox-wizard'

export function SandboxPage() {
  const auth = useAuth()

  const handleSignUp = () => {
    window.location.href = '/'
  }

  return <SandboxWizard onSignUp={handleSignUp} />
}
