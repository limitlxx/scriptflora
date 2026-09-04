/**
 * GET /api/hyperframes/status?taskId=…&mode=local_cli&outputDir=…
 * Phase 11 — Poll HyperFrames render task status.
 *
 * Handles all three render modes:
 *   - simulated  → SUCCEEDED immediately (taskId starts with "hf-", no mode param)
 *   - local_cli  → polls output directory for completed render files
 *   - heygen_cloud → polls HeyGen Rendering API
 */
import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import type { HyperFramesOutputAsset } from '@/lib/flow-types'

const HEYGEN_API_BASE = 'https://api.heygen.com/v3/hyperframes'

export type HyperFramesStatusResponse = {
  taskId: string
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED'
  outputAssets?: HyperFramesOutputAsset[]
  errorMessage?: string
  simulated?: boolean
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const taskId   = url.searchParams.get('taskId')
  const mode     = url.searchParams.get('mode') ?? 'auto'
  const outputDir = url.searchParams.get('outputDir')

  if (!taskId) return Response.json({ error: 'taskId required' }, { status: 400 })

  // ── Local CLI path ───────────────────────────────────────────────
  if (mode === 'local_cli' || process.env.HYPERFRAMES_LOCAL === 'true') {
    const dir = outputDir ?? join('/tmp', 'hf-renders', taskId)
    try {
      const files = await readdir(dir)
      // The CLI writes video files to the output dir when done
      const videoFiles = files.filter((f) =>
        f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mov')
      )

      if (videoFiles.length > 0) {
        // Build output assets from completed files
        const assets: HyperFramesOutputAsset[] = await Promise.all(
          videoFiles.map(async (f) => {
            // Infer ratio from filename convention e.g. "output-16x9.mp4"
            const ratioMatch = f.match(/(\d+x\d+)/i)
            const ratio = ratioMatch ? ratioMatch[1].replace('x', ':') : '16:9'
            const filePath = join(dir, f)
            // We can't serve local files directly from a browser — return
            // a server-relative path. The caller can download via a file API
            // or the user opens the output dir.
            // ponytail: local file serving needs a dedicated file route.
            // Ceiling: no inline video preview for local renders.
            const fileStat = await stat(filePath).catch(() => null)
            return {
              ratio,
              url: `/api/hyperframes/file?path=${encodeURIComponent(filePath)}`,
              format: f.split('.').pop() ?? 'mp4',
              localPath: filePath,
              sizeBytes: fileStat?.size ?? 0,
            } as HyperFramesOutputAsset & { localPath: string; sizeBytes: number }
          })
        )
        return Response.json({ taskId, status: 'SUCCEEDED', outputAssets: assets } satisfies HyperFramesStatusResponse)
      }

      // Check for error file written by CLI
      if (files.includes('render.error')) {
        return Response.json({ taskId, status: 'FAILED', errorMessage: 'CLI render failed — check render.error in output dir.' } satisfies HyperFramesStatusResponse)
      }

      // Still processing
      return Response.json({ taskId, status: 'PROCESSING' } satisfies HyperFramesStatusResponse)

    } catch {
      // Output dir doesn't exist yet — still pending
      return Response.json({ taskId, status: 'PENDING' } satisfies HyperFramesStatusResponse)
    }
  }

  // ── Simulated path (hf- prefix, no real key) ────────────────────
  if (taskId.startsWith('hf-') && !process.env.HEYGEN_API_KEY) {
    return Response.json({
      taskId,
      status: 'SUCCEEDED',
      outputAssets: [],
      simulated: true,
    } satisfies HyperFramesStatusResponse)
  }

  // ── HeyGen Cloud path ────────────────────────────────────────────
  if (!process.env.HEYGEN_API_KEY) {
    return Response.json({ error: 'HEYGEN_API_KEY not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(`${HEYGEN_API_BASE}/renders/${taskId}`, {
      headers: { 'X-Api-Key': process.env.HEYGEN_API_KEY },
    })

    if (!res.ok) {
      return Response.json({ error: 'Failed to fetch render status' }, { status: res.status })
    }

    const data = await res.json() as {
      status?: string
      output_assets?: Array<{ ratio: string; url: string; format?: string }>
      error?: string
    }

    const outputAssets: HyperFramesOutputAsset[] = (data.output_assets ?? []).map((a) => ({
      ratio: a.ratio,
      url: a.url,
      format: a.format ?? 'mp4',
    }))

    const status = (() => {
      const s = (data.status ?? '').toUpperCase()
      if (s === 'COMPLETED' || s === 'SUCCEEDED') return 'SUCCEEDED'
      if (s === 'FAILED' || s === 'ERROR')         return 'FAILED'
      if (s === 'PROCESSING' || s === 'RUNNING')   return 'PROCESSING'
      return 'PENDING'
    })() as HyperFramesStatusResponse['status']

    return Response.json({ taskId, status, outputAssets, errorMessage: data.error } satisfies HyperFramesStatusResponse)

  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Network error' }, { status: 500 })
  }
}
