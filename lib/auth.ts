/**
 * Minimal auth helpers — reads the LWC session cookie set by /api/chatgpt/*.
 * ponytail: no abstraction layer, just cookie read + boolean.
 */
import { cookies } from 'next/headers'

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return Boolean(store.get('lwc_session')?.value)
}
