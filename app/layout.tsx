import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Suspense } from 'react'
import { AuthProvider } from '@/components/auth-context'
import { PageProgress } from '@/components/page-progress'

// No Google Fonts — system font stack loads instantly, zero network round-trip.
// ponytail: Geist is beautiful but adds ~100ms to TTFB on first load.

export const metadata: Metadata = {
  title: 'ScriptFlow — AI Scriptwriting Assistant',
  description:
    'Node-based AI scriptwriting. Structured scripts, continuity guaranteed. Bring your own ChatGPT subscription.',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0A0A0B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-background">
      <body className="antialiased">
        <AuthProvider>
          <Suspense fallback={null}>
            <PageProgress />
          </Suspense>
          {children}
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
