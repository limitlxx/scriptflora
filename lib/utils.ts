import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Trim a script stage to fit a target word count derived from a seconds-per-set
 * AI video generation window.
 *
 * Rule of thumb: spoken word rate ≈ 130 wpm for narration, so:
 *   targetWords = Math.round(secondsPerSet / 60 * 130)
 *
 * If the content is already within target, it is returned unchanged.
 * If it's over, we cut at the nearest sentence boundary before the limit.
 *
 * ponytail: sentence-boundary split — no NLP lib needed, just ". " heuristic.
 */
export function trimToSetWindow(content: string, secondsPerSet: number): string {
  const targetWords = Math.round((secondsPerSet / 60) * 130)
  const words = content.trim().split(/\s+/)
  if (words.length <= targetWords) return content

  // Cut to targetWords, then walk back to the nearest sentence end
  const rough = words.slice(0, targetWords).join(' ')
  const lastPeriod = Math.max(
    rough.lastIndexOf('. '),
    rough.lastIndexOf('! '),
    rough.lastIndexOf('? '),
    rough.lastIndexOf('.\n'),
  )
  const trimmed = lastPeriod > rough.length * 0.5
    ? rough.slice(0, lastPeriod + 1)
    : rough

  return trimmed.trim()
}
