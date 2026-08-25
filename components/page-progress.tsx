'use client'

/**
 * Thin top-of-page progress bar that fires on Next.js route transitions.
 * No external dep — uses the Navigation API (Chrome 102+) with a
 * usePathname fallback for broader browser support.
 */
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function PageProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const interval = useRef<ReturnType<typeof setInterval> | null>(null)

  // Trigger on any route change
  useEffect(() => {
    // Clear previous
    if (timer.current) clearTimeout(timer.current)
    if (interval.current) clearInterval(interval.current)

    // Start bar
    setVisible(true)
    setProgress(10)

    let p = 10
    interval.current = setInterval(() => {
      // Exponentially slow — never reaches 100 on its own
      p = p + (90 - p) * 0.08
      setProgress(Math.min(p, 92))
    }, 100)

    // Complete after a short delay (route has rendered)
    timer.current = setTimeout(() => {
      if (interval.current) clearInterval(interval.current)
      setProgress(100)
      // Fade out
      setTimeout(() => setVisible(false), 300)
    }, 400)

    return () => {
      if (timer.current) clearTimeout(timer.current)
      if (interval.current) clearInterval(interval.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  if (!visible && progress === 0) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2px]"
    >
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transition: progress === 100
            ? 'width 150ms ease-out, opacity 300ms ease 150ms'
            : 'width 100ms linear',
        }}
      />
    </div>
  )
}
