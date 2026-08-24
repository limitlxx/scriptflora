'use client'

/**
 * Renders the LWC button when LWC is configured, otherwise a plain canvas link.
 * ponytail: single component so the landing page stays a server component.
 */
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { OpenAiMark } from '@/components/openai-mark'

// LoginWithChatGPT is a client component from the LWC React package.
// We lazy-import so the build doesn't break when the package is present
// but LWC_SECRET is not yet configured.
let LoginWithChatGPT: React.ComponentType<{ callbackUrl?: string }> | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  LoginWithChatGPT = require('@opencoredev/loginwithchatgpt-react').LoginWithChatGPT
} catch {
  // package not installed — use fallback
}

export function AuthButton() {
  if (LoginWithChatGPT) {
    return (
      <LoginWithChatGPT callbackUrl="/projects" />
    )
  }

  // Fallback: direct link (dev mode / no LWC secret)
  return (
    <Link
      href="/projects"
      className="group bg-primary text-primary-foreground focus-visible:ring-ring flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[oklch(0.145_0.004_285)] focus-visible:outline-none"
    >
      <OpenAiMark className="size-4" />
      Continue with ChatGPT
      <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  )
}
