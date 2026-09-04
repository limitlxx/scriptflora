/**
 * POST /api/hyperframes/render
 * Phase 11 — HyperFrames composition node.
 *
 * Three render modes, chosen automatically based on env vars:
 *
 *   1. Local CLI  (HYPERFRAMES_LOCAL=true)
 *      Writes a composition JSON to /tmp, runs `hyperframes check` then
 *      `hyperframes render`. Opt-in — useful offline or to avoid cloud cost.
 *      Requires: `npm install -g @heygen/hyperframes` (or `npx @heygen/hyperframes`)
 *
 *   2. HeyGen Cloud  (HEYGEN_API_KEY set, HYPERFRAMES_LOCAL not set)
 *      Submits composition to HeyGen Rendering API and polls for result.
 *
 *   3. Simulated  (neither key present)
 *      Returns a fake task ID immediately. Full canvas UI works with no
 *      credentials — good for development.
 *
 * HeyGen HyperFrames API: https://hyperframes.heygen.com/developers
 * Local CLI docs: https://hyperframes.heygen.com/cli
 */
import { nanoid } from 'nanoid'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import type {
  HyperFramesTemplate,
  HyperFramesClipMapping,
  HyperFramesProvenance,
} from '@/lib/flow-types'

const execAsync = promisify(exec)
const HEYGEN_API_BASE = 'https://api.heygen.com/v3/hyperframes'

const TEMPLATE_VERSIONS: Record<HyperFramesTemplate, string> = {
  explainer_16x9:    '1.0.0',
  ad_endcard_16x9:   '1.0.0',
  social_9x16:       '1.0.0',
  training_module:   '1.0.0',
}

export type HyperFramesRenderRequest = {
  templateId: HyperFramesTemplate
  aspectRatios: string[]
  variables: Record<string, string>
  clipMappings: HyperFramesClipMapping[]
}

export type HyperFramesRenderResponse = {
  taskId: string
  renderMode: 'heygen_cloud' | 'local_cli' | 'simulated'
  provenance: HyperFramesProvenance
  simulated?: boolean
  localOutputDir?: string   // set when renderMode = local_cli
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? ''
  if (process.env.LWC_SECRET && !cookieHeader.includes('lwc_session=')) {
    return Response.json({ error: 'Sign in with ChatGPT first.' }, { status: 401 })
  }

  let body: HyperFramesRenderRequest
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { templateId, aspectRatios, variables, clipMappings } = body
  if (!templateId) {
    return Response.json({ error: 'templateId is required' }, { status: 400 })
  }

  const taskId = `hf-${nanoid(10)}`
  const useLocalCli = process.env.HYPERFRAMES_LOCAL === 'true'
  const renderMode = useLocalCli
    ? 'local_cli'
    : process.env.HEYGEN_API_KEY
    ? 'heygen_cloud'
    : 'simulated'

  const provenance: HyperFramesProvenance = {
    provider: 'hyperframes',
    renderMode,
    templateId,
    templateVersion: TEMPLATE_VERSIONS[templateId] ?? '1.0.0',
    variables: variables ?? {},
    sourceClipIds: (clipMappings ?? []).map((c) => c.resultNodeId),
    aspectRatios: aspectRatios ?? ['16:9'],
    renderIds: [taskId],
    outputAssets: [],
    createdAt: new Date().toISOString(),
  }

  // ── 1. Local CLI path ────────────────────────────────────────────
  if (useLocalCli) {
    try {
      const outDir = join('/tmp', 'hf-renders', taskId)
      await mkdir(outDir, { recursive: true })

      // Build the composition JSON that the HyperFrames CLI consumes
      const composition = {
        template: templateId,
        version: TEMPLATE_VERSIONS[templateId] ?? '1.0.0',
        aspectRatios: aspectRatios ?? ['16:9'],
        variables: {
          ...(variables ?? {}),
          _tracks: JSON.stringify(
            (clipMappings ?? []).map((c, i) => ({
              slot: i,
              label: c.clipLabel,
              videoUrl: c.videoUrl ?? '',
              audioUrl: c.audioUrl ?? '',
              durationSeconds: c.durationSeconds,
            }))
          ),
        },
        output: outDir,
      }

      const compFile = join(outDir, 'composition.json')
      await writeFile(compFile, JSON.stringify(composition, null, 2))

      // Determine CLI binary — prefer global install, fallback to npx
      const cli = process.env.HYPERFRAMES_CLI_BIN ?? 'hyperframes'

      // Step 1: check composition is valid
      await execAsync(`${cli} check "${compFile}"`, { timeout: 30_000 })

      // Step 2: start render (async — CLI writes outputs to outDir)
      // ponytail: we fire-and-forget the render so the HTTP response
      // returns immediately. The status route polls the output directory.
      // Ceiling: long renders may outlast the Node process in serverless.
      // Upgrade path: use a proper job queue.
      execAsync(`${cli} render "${compFile}"`, { timeout: 600_000 }).catch((err) => {
        console.error('[hyperframes CLI render]', err)
      })

      return Response.json({
        taskId,
        renderMode: 'local_cli',
        provenance,
        localOutputDir: outDir,
      } satisfies HyperFramesRenderResponse)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'CLI render failed'
      console.error('[/api/hyperframes/render local]', message)

      // Surface helpful install hint
      const hint = message.includes('not found') || message.includes('ENOENT')
        ? ' — is the HyperFrames CLI installed? Run: npm install -g @heygen/hyperframes'
        : ''

      return Response.json({ error: `${message}${hint}` }, { status: 500 })
    }
  }

  // ── 2. Simulated path (no keys) ──────────────────────────────────
  if (!process.env.HEYGEN_API_KEY) {
    return Response.json({
      taskId,
      renderMode: 'simulated',
      provenance,
      simulated: true,
    } satisfies HyperFramesRenderResponse)
  }

  // ── 3. HeyGen Cloud path ─────────────────────────────────────────
  const tracks = (clipMappings ?? []).map((c, i) => ({
    slot: i,
    label: c.clipLabel,
    videoUrl: c.videoUrl ?? '',
    audioUrl: c.audioUrl ?? '',
    durationSeconds: c.durationSeconds,
  }))

  const heygenBody = {
    template_id: templateId,
    variables: {
      ...variables,
      _tracks: JSON.stringify(tracks),
    },
    output_ratios: aspectRatios,
  }

  try {
    const res = await fetch(`${HEYGEN_API_BASE}/renders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.HEYGEN_API_KEY,
      },
      body: JSON.stringify(heygenBody),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      return Response.json(
        { error: (err as { message?: string }).message ?? 'HeyGen render failed.' },
        { status: res.status },
      )
    }

    const data = await res.json() as { render_id?: string; task_id?: string }
    const heygenTaskId = data.render_id ?? data.task_id ?? taskId
    provenance.renderIds = [heygenTaskId]

    return Response.json({
      taskId: heygenTaskId,
      renderMode: 'heygen_cloud',
      provenance,
    } satisfies HyperFramesRenderResponse)

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    console.error('[/api/hyperframes/render]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
