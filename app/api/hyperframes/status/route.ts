/**
 * GET /api/hyperframes/status?taskId=…&mode=…&outputDir=…
 * Phase 11 — Poll HyperFrames render status.
 *
 * HeyGen Cloud API: GET /v3/hyperframes/renders/{render_id}
 * Response shape: { render_id, status, video_url?, thumbnail_url?, error? }
 * status values: pending | processing | completed | failed
 *
 * Local CLI: poll the output directory for completed render files.
 * Simulated: SUCCEEDED immediately for hf- prefixed IDs.
 *
 * Docs: https://developers.heygen.com/reference/get-hyperframes-render
 */
import { readdir, stat } from 'fs/promises'
import { join, resolve } from 'path'
import type { HyperFramesOutputAsset } from '@/lib/flow-types'

const HEYGEN_API_BASE = process.env.HEYGEN_API_URL ?? 'https://api.heygen.com'
const ALLOWED_DIR = resolve('/tmp/hf-renders')

export type HyperFramesStatusResponse = {
  taskId: string
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED'
  outputAssets?: HyperFramesOutputAsset[]
  errorMessage?: string
  simulated?: boolean
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const taskId    = url.searchParams.get('taskId')
  const mode      = url.searchParams.get('mode') ?? 'auto'
  const outputDir = url.searchParams.get('outputDir')

  if (!taskId) return Response.json({ error: 'taskId required' }, { status: 400 })

  // ── Local CLI path ───────────────────────────────────────────────
  if (mode === 'local_cli' || process.env.HYPERFRAMES_LOCAL === 'true') {
    const dir = outputDir
      ? resolve(outputDir)
      : resolve(ALLOWED_DIR, taskId)

    // Security: must stay inside allowed directory
    if (!dir.startsWith(ALLOWED_DIR)) {
      return Response.json({ error: 'Path not allowed' }, { status: 403 })
    }

    try {
      const files = await readdir(dir)
      const videoFiles = files.filter((f) =>
        f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mov')
      )

      if (videoFiles.length > 0) {
        const assets: HyperFramesOutputAsset[] = await Promise.all(
          videoFiles.map(async (f) => {
            const ratioMatch = f.match(/(\d+x\d+)/i)
            const ratio = ratioMatch ? ratioMatch[1].replace('x', ':') : '16:9'
            const filePath = join(dir, f)
            const fileStat = await stat(filePath).catch(() => null)
            return {
              ratio,
              // Serve via the /api/hyperframes/file route
              url: `/api/hyperframes/file?path=${encodeURIComponent(filePath)}`,
              format: f.split('.').pop() ?? 'mp4',
              localPath: filePath,
              sizeBytes: fileStat?.size ?? 0,
            } as HyperFramesOutputAsset & { localPath: string; sizeBytes: number }
          })
        )
        return Response.json({ taskId, status: 'SUCCEEDED', outputAssets: assets } satisfies HyperFramesStatusResponse)
      }

      if (files.includes('render.error')) {
        const errMsg = await readdir(join(dir, 'render.error')).catch(() => 'CLI render failed')
        return Response.json({ taskId, status: 'FAILED', errorMessage: String(errMsg) } satisfies HyperFramesStatusResponse)
      }

      return Response.json({ taskId, status: 'PROCESSING' } satisfies HyperFramesStatusResponse)
    } catch {
      return Response.json({ taskId, status: 'PENDING' } satisfies HyperFramesStatusResponse)
    }
  }

  // ── Simulated path ───────────────────────────────────────────────
  if (taskId.startsWith('hf-') && !process.env.HEYGEN_API_KEY) {
    return Response.json({
      taskId,
      status: 'SUCCEEDED',
      outputAssets: [],
      simulated: true,
    } satisfies HyperFramesStatusResponse)
  }

  // ── HeyGen Cloud path ────────────────────────────────────────────
  // GET /v3/hyperframes/renders/{render_id}
  // Returns: { render_id, status, video_url, thumbnail_url, error }
  // status: pending | processing | completed | failed
  if (!process.env.HEYGEN_API_KEY) {
    return Response.json({ error: 'HEYGEN_API_KEY not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(`${HEYGEN_API_BASE}/v3/hyperframes/renders/${taskId}`, {
      headers: {
        'X-Api-Key': process.env.HEYGEN_API_KEY,
      },
    })

    if (!res.ok) {
      return Response.json({ error: `HeyGen API error: ${res.status}` }, { status: res.status })
    }

    const data = await res.json() as {
      render_id?: string
      status?: string          // pending | processing | completed | failed
      video_url?: string       // signed S3 URL — re-fetch on each poll, do not cache
      thumbnail_url?: string
      error?: string
    }

    // Normalise HeyGen status → our status enum
    const rawStatus = (data.status ?? '').toLowerCase()
    const status: HyperFramesStatusResponse['status'] =
      rawStatus === 'completed'  ? 'SUCCEEDED' :
      rawStatus === 'failed'     ? 'FAILED'    :
      rawStatus === 'processing' ? 'PROCESSING' :
                                   'PENDING'

    const outputAssets: HyperFramesOutputAsset[] = data.video_url
      ? [{ ratio: '16:9', url: data.video_url, format: 'mp4' }]
      : []

    return Response.json({
      taskId,
      status,
      outputAssets,
      errorMessage: data.error,
    } satisfies HyperFramesStatusResponse)

  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Network error' }, { status: 500 })
  }
}
