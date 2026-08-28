'use client'

import { useSearchParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

export function SessionBanner() {
  const params = useSearchParams()
  if (params.get('session') !== 'expired') return null
  return (
    <div
      role="alert"
      className="mb-6 flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[12.5px] text-destructive"
    >
      <AlertCircle className="size-4 shrink-0" />
      Your session expired. Sign in again to continue.
    </div>
  )
}
