/**
 * GET /api/hyperframes/file?path=…
 * Phase 11 — Serve local CLI render outputs to the browser.
 *
 * Only active when HYPERFRAMES_LOCAL=true.
 * Restricted to /tmp/hf-renders/ to prevent path traversal.
 *
 * ponytail: simple path allowlist check — no extra dependency needed.
 */
import { readFile } from 'fs/promises'
import { resolve } from 'path'

const ALLOWED_DIR = '/tmp/hf-renders/'

const MIME: Record<string, string> = {
  mp4:  'video/mp4',
  webm: 'video/webm',
  mov:  'video/quicktime',
  json: 'application/json',
}

export async function GET(request: Request) {
  // Only allow in local CLI mode
  if (process.env.HYPERFRAMES_LOCAL !== 'true') {
    return new Response('Local CLI not enabled', { status: 403 })
  }

  const rawPath = new URL(request.url).searchParams.get('path')
  if (!rawPath) return new Response('path required', { status: 400 })

  // Resolve and verify the path stays inside the allowed directory
  const safePath = resolve(rawPath)
  if (!safePath.startsWith(ALLOWED_DIR)) {
    return new Response('Path not allowed', { status: 403 })
  }

  try {
    const data = await readFile(safePath)
    const ext = safePath.split('.').pop()?.toLowerCase() ?? ''
    const contentType = MIME[ext] ?? 'application/octet-stream'

    return new Response(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(data.byteLength),
        // Allow range requests so <video> seeking works
        'Accept-Ranges': 'bytes',
        // Cache for 1 hour — local renders don't change
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return new Response('File not found', { status: 404 })
  }
}
