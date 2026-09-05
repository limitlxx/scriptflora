/**
 * GET /api/hyperframes/preview?templateId=…&variables=<json>
 * Phase 11 — Serve a HyperFrames template HTML for live preview.
 *
 * Reads the template from public/hyperframes-templates/{id}/index.html,
 * injects the variables as a JSON bootstrap script, and returns the HTML
 * for use in <hyperframes-player> or a plain <iframe>.
 *
 * The variables are injected via a script that sets window.__hfPreviewVars
 * before the composition script runs, which the template reads as a fallback
 * when window.__hyperframes.getVariables() is not available (preview context).
 */
import { readFile } from 'fs/promises'
import { join } from 'path'

const TEMPLATE_DIRS: Record<string, string> = {
  explainer_16x9:    'explainer_16x9',
  ad_endcard_16x9:   'ad_endcard_16x9',
  social_9x16:       'social_9x16',
  training_module:   'training_module',
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const templateId = url.searchParams.get('templateId')
  const variablesRaw = url.searchParams.get('variables') ?? '{}'

  if (!templateId || !TEMPLATE_DIRS[templateId]) {
    return new Response('templateId required', { status: 400 })
  }

  let variables: Record<string, string> = {}
  try { variables = JSON.parse(variablesRaw) } catch { /* use empty */ }

  const templatePath = join(
    process.cwd(), 'public', 'hyperframes-templates',
    TEMPLATE_DIRS[templateId], 'index.html'
  )

  let html: string
  try {
    html = await readFile(templatePath, 'utf-8')
  } catch {
    return new Response('Template not found', { status: 404 })
  }

  // Inject a bootstrap script that exposes variables via
  // window.__hyperframes.getVariables() — the same API the render uses.
  const bootstrap = `<script>
window.__hyperframes = window.__hyperframes || {};
window.__hyperframes._previewVars = ${JSON.stringify(variables)};
window.__hyperframes.getVariables = function() {
  return window.__hyperframes._previewVars || {};
};
</script>`

  // Insert bootstrap before </head> or at the start of <body>
  const injected = html.includes('</head>')
    ? html.replace('</head>', `${bootstrap}\n</head>`)
    : html.replace('<body>', `<body>\n${bootstrap}`)

  return new Response(injected, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Allow iframe embedding from same origin
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'no-store',
    },
  })
}
