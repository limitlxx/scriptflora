/**
 * POST /api/hyperframes/render
 * Phase 11 — HyperFrames composition node.
 *
 * HyperFrames turns HTML/CSS/JS compositions into rendered video.
 * Each template is a real HyperFrames-compatible HTML project stored under
 * public/hyperframes-templates/{templateId}/index.html.
 *
 * Variables are injected at render time via window.__hyperframes.getVariables().
 * The _clips variable carries the JSON-encoded clip array from the Timeline node.
 *
 * Three render modes:
 *
 *   1. HeyGen Cloud  (HEYGEN_API_KEY set, HYPERFRAMES_LOCAL not set)
 *      Reads the template HTML, base64-encodes it, submits to:
 *      POST /v3/hyperframes/renders
 *      Auth header: X-Api-Key
 *      Polls: GET /v3/hyperframes/renders/{render_id}
 *      Response: { render_id, status, video_url }
 *
 *   2. Local CLI  (HYPERFRAMES_LOCAL=true)
 *      Uses: npx hyperframes render <projectDir> --output <file> --variables '<json>'
 *      The template dir is copied to /tmp/hf-renders/{taskId}/ and rendered there.
 *      No account required. Chrome + FFmpeg must be on PATH.
 *      Install: npm install -g hyperframes
 *
 *   3. Simulated  (neither configured)
 *      Returns hf-{id} immediately. Canvas UI fully exercisable without credentials.
 *
 * Docs:
 *   Cloud CLI:    https://hyperframes.mintlify.app/deploy/cloud
 *   Local render: https://hyperframes.mintlify.app/guides/rendering
 *   Cloud API:    https://developers.heygen.com/reference/create-hyperframes-render
 */
import { nanoid } from 'nanoid'
import { readFile, writeFile, mkdir, cp } from 'fs/promises'
import { join, resolve } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import type {
  HyperFramesTemplate,
  HyperFramesClipMapping,
  HyperFramesProvenance,
} from '@/lib/flow-types'

const execAsync = promisify(exec)
const HEYGEN_API_BASE = process.env.HEYGEN_API_URL ?? 'https://api.heygen.com'

// Map templateId → disk path under public/hyperframes-templates/
const TEMPLATE_DIRS: Record<HyperFramesTemplate, string> = {
  explainer_16x9:    'explainer_16x9',
  ad_endcard_16x9:   'ad_endcard_16x9',
  social_9x16:       'social_9x16',
  training_module:   'training_module',
}

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
  /** render_id from HeyGen, or local/simulated task ID */
  taskId: string
  renderMode: 'heygen_cloud' | 'local_cli' | 'simulated'
  provenance: HyperFramesProvenance
  simulated?: boolean
  localOutputDir?: string
}

/** Build the variables object to inject, including the _clips track list */
function buildVariables(
  variables: Record<string, string>,
  clipMappings: HyperFramesClipMapping[],
): Record<string, string> {
  const clips = clipMappings.map((c) => ({
    videoUrl:  c.videoUrl  ?? '',
    audioUrl:  c.audioUrl  ?? '',
    startTime: '0',
    duration:  String(c.durationSeconds),
    label:     c.clipLabel,
  }))
  return { ...variables, _clips: JSON.stringify(clips) }
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
  if (!templateId) return Response.json({ error: 'templateId is required' }, { status: 400 })

  const taskId = `hf-${nanoid(10)}`
  const useLocalCli = process.env.HYPERFRAMES_LOCAL === 'true'
  const renderMode = useLocalCli
    ? 'local_cli'
    : process.env.HEYGEN_API_KEY ? 'heygen_cloud' : 'simulated'

  const mergedVars = buildVariables(variables ?? {}, clipMappings ?? [])

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

  // Load the template HTML from disk
  const templateDir = join(process.cwd(), 'public', 'hyperframes-templates', TEMPLATE_DIRS[templateId])
  let templateHtml: string
  try {
    templateHtml = await readFile(join(templateDir, 'index.html'), 'utf-8')
  } catch {
    return Response.json({ error: `Template "${templateId}" not found on disk.` }, { status: 500 })
  }

  // ── 1. Local CLI path ────────────────────────────────────────────
  // npx hyperframes render <dir> --output <file> --variables '<json>'
  if (useLocalCli) {
    try {
      const outDir = resolve('/tmp/hf-renders', taskId)
      await mkdir(outDir, { recursive: true })

      // Copy the template project to the temp dir
      await cp(templateDir, outDir, { recursive: true })

      const cli = process.env.HYPERFRAMES_CLI_BIN ?? 'npx hyperframes'
      const outputPath = join(outDir, 'output.mp4')
      const aspectFlag = (aspectRatios?.[0] === '9:16') ? '--aspect-ratio 9:16' : '--aspect-ratio 16:9'
      // Escape single quotes in the JSON for shell safety
      const varsJson = JSON.stringify(mergedVars).replace(/'/g, "'\\''")

      // Fire-and-forget: HTTP responds immediately, CLI runs in background
      execAsync(
        `${cli} render "${outDir}" --output "${outputPath}" --variables '${varsJson}' ${aspectFlag} --quality standard`,
        { timeout: 600_000 }
      ).catch((err: Error) => {
        console.error('[hyperframes CLI]', err.message)
        void writeFile(join(outDir, 'render.error'), err.message, 'utf-8').catch(() => {})
      })

      return Response.json({
        taskId,
        renderMode: 'local_cli',
        provenance,
        localOutputDir: outDir,
      } satisfies HyperFramesRenderResponse)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'CLI render failed'
      const hint = (message.includes('not found') || message.includes('ENOENT'))
        ? ' — is hyperframes installed? Run: npm install -g hyperframes'
        : ''
      return Response.json({ error: `${message}${hint}` }, { status: 500 })
    }
  }

  // ── 2. Simulated path ────────────────────────────────────────────
  if (!process.env.HEYGEN_API_KEY) {
    return Response.json({
      taskId,
      renderMode: 'simulated',
      provenance,
      simulated: true,
    } satisfies HyperFramesRenderResponse)
  }

  // ── 3. HeyGen Cloud path ─────────────────────────────────────────
  // Submit the composition HTML as base64 to POST /v3/hyperframes/renders.
  // The API returns a render_id. Poll GET /v3/hyperframes/renders/{render_id}.
  // Docs: https://developers.heygen.com/reference/create-hyperframes-render
  try {
    const base64Project = Buffer.from(templateHtml).toString('base64')

    const renderRes = await fetch(`${HEYGEN_API_BASE}/v3/hyperframes/renders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.HEYGEN_API_KEY,
      },
      body: JSON.stringify({
        project_data: base64Project,        // base64-encoded composition HTML
        variables:    mergedVars,           // merged user vars + _clips track list
        aspect_ratio: aspectRatios?.[0] ?? '16:9',
        format:       'mp4',
        quality:      'standard',
        title:        `ScriptFlora · ${templateId}`,
      }),
    })

    if (!renderRes.ok) {
      const err = await renderRes.json().catch(() => ({ message: renderRes.statusText }))
      return Response.json(
        { error: (err as { message?: string }).message ?? 'HeyGen render submission failed.' },
        { status: renderRes.status },
      )
    }

    const data = await renderRes.json() as { render_id?: string; id?: string }
    const renderId = data.render_id ?? data.id ?? taskId
    provenance.renderIds = [renderId]

    return Response.json({
      taskId: renderId,
      renderMode: 'heygen_cloud',
      provenance,
    } satisfies HyperFramesRenderResponse)

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    console.error('[/api/hyperframes/render]', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
