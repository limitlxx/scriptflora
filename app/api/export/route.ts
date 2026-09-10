/**
 * POST /api/export
 *
 * Server-side document export for PDF and DOCX.
 *
 * PDF  — returns styled HTML the client opens in a new window; the user
 *         prints/saves from the browser (window.print()). Zero server deps.
 *
 * DOCX — builds a minimal Office Open XML document (.docx) from raw XML
 *         and returns it as a binary download. No npm packages needed —
 *         a .docx is just a ZIP of XML files, and Node has Buffer + zlib.
 *
 * ponytail: ceiling — headless Chrome PDF (Puppeteer) and full docx
 * library are the production upgrades. This covers 90% of use-cases
 * without adding dependencies.
 */

import { gzipSync } from 'zlib'

type Stage = {
  label: string
  index?: number
  content: string
  kind?: string
}

type ExportBody = {
  format: 'pdf' | 'docx'
  title: string
  objective?: string
  audience?: string
  duration?: string
  tone?: string
  stages: Stage[]
  filename?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stageHeading(s: Stage): string {
  return s.index != null ? `${s.label} ${s.index}` : s.label
}

// ── PDF (HTML) ────────────────────────────────────────────────────────────────

function buildPdfHtml(body: ExportBody): string {
  const metaRows = [
    body.objective && `<tr><th>Objective</th><td>${esc(body.objective)}</td></tr>`,
    body.audience && `<tr><th>Audience</th><td>${esc(body.audience)}</td></tr>`,
    body.duration && `<tr><th>Duration</th><td>${esc(body.duration)}</td></tr>`,
    body.tone && `<tr><th>Tone</th><td>${esc(body.tone)}</td></tr>`,
  ].filter(Boolean).join('\n')

  const sections = body.stages
    .filter((s) => s.content.trim())
    .map((s) => `
      <section>
        <h2>${esc(stageHeading(s))}</h2>
        <p>${esc(s.content.trim()).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>
      </section>`)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(body.title)}</title>
<style>
  @page { size: A4; margin: 25mm 20mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.7; color: #111; max-width: 680px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 24pt; margin-bottom: 8px; }
  .meta { font-size: 10pt; color: #555; margin-bottom: 24px; border-top: 1px solid #ddd; padding-top: 8px; }
  .meta table { border-collapse: collapse; }
  .meta th { text-align: left; width: 90px; font-weight: 600; padding: 2px 8px 2px 0; color: #333; }
  .meta td { padding: 2px 0; }
  section { margin-top: 28px; page-break-inside: avoid; }
  h2 { font-size: 13pt; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  p { margin: 0 0 10px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>${esc(body.title)}</h1>
  ${metaRows ? `<div class="meta"><table>${metaRows}</table></div>` : ''}
  ${sections}
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`
}

// ── DOCX (Office Open XML) ────────────────────────────────────────────────────
// A .docx is a ZIP containing:
//   [Content_Types].xml, _rels/.rels, word/document.xml, word/_rels/document.xml.rels
//
// We build it using a minimal ZIP implementation (stored, no compression needed
// for XML text files — keeps code simple). Node's Buffer handles binary.

function uint32LE(n: number): Buffer {
  const b = Buffer.allocUnsafe(4)
  b.writeUInt32LE(n, 0)
  return b
}
function uint16LE(n: number): Buffer {
  const b = Buffer.allocUnsafe(2)
  b.writeUInt16LE(n, 0)
  return b
}

function crc32(buf: Buffer): number {
  // CRC32 table-based (required by ZIP spec)
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[i] = c
    }
    return t
  })())
  let c = 0xffffffff
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
crc32.table = null as Uint32Array | null

interface ZipEntry { name: string; data: Buffer; offset: number }

function buildZip(files: { name: string; content: string }[]): Buffer {
  const entries: ZipEntry[] = []
  const parts: Buffer[] = []
  let offset = 0

  for (const { name, content } of files) {
    const nameB = Buffer.from(name, 'utf8')
    const dataB = Buffer.from(content, 'utf8')
    const crc = crc32(dataB)
    const size = dataB.length

    const local = Buffer.concat([
      Buffer.from('504b0304', 'hex'),  // local file header sig
      uint16LE(20),                    // version needed
      uint16LE(0),                     // general purpose bit flag
      uint16LE(0),                     // compression (stored)
      uint16LE(0),                     // mod time
      uint16LE(0),                     // mod date
      uint32LE(crc),
      uint32LE(size),
      uint32LE(size),
      uint16LE(nameB.length),
      uint16LE(0),                     // extra field length
      nameB,
      dataB,
    ])

    entries.push({ name, data: dataB, offset })
    offset += local.length
    parts.push(local)
  }

  // Central directory
  const cdParts: Buffer[] = []
  for (const e of entries) {
    const nameB = Buffer.from(e.name, 'utf8')
    const crc = crc32(e.data)
    const size = e.data.length
    cdParts.push(Buffer.concat([
      Buffer.from('504b0102', 'hex'),
      uint16LE(20), uint16LE(20), uint16LE(0), uint16LE(0),
      uint16LE(0), uint16LE(0),
      uint32LE(crc), uint32LE(size), uint32LE(size),
      uint16LE(nameB.length), uint16LE(0), uint16LE(0),
      uint16LE(0), uint16LE(0), uint32LE(0),
      uint32LE(e.offset),
      nameB,
    ]))
  }
  const cdBuf = Buffer.concat(cdParts)

  const eocd = Buffer.concat([
    Buffer.from('504b0506', 'hex'),
    uint16LE(0), uint16LE(0),
    uint16LE(entries.length), uint16LE(entries.length),
    uint32LE(cdBuf.length),
    uint32LE(offset),
    uint16LE(0),
  ])

  return Buffer.concat([...parts, cdBuf, eocd])
}

function buildDocx(body: ExportBody): Buffer {
  const paraXml = (text: string, style?: string) => {
    const styleTag = style ? `<w:pStyle w:val="${style}"/>` : ''
    const runs = text.trim().split('\n').flatMap((line, i) => {
      const run = `<w:r><w:t xml:space="preserve">${esc(line)}</w:t></w:r>`
      return i > 0 ? [`<w:r><w:br/></w:r>`, run] : [run]
    }).join('')
    return `<w:p><w:pPr><w:jc w:val="both"/>${styleTag ? `<w:pStyle w:val="${style}"/>` : ''}</w:pPr>${runs}</w:p>`
  }

  const title = `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${esc(body.title)}</w:t></w:r></w:p>`

  const meta = [
    body.objective && `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Objective: </w:t></w:r><w:r><w:t>${esc(body.objective)}</w:t></w:r></w:p>`,
    body.audience && `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Audience: </w:t></w:r><w:r><w:t>${esc(body.audience)}</w:t></w:r></w:p>`,
    body.duration && `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Duration: </w:t></w:r><w:r><w:t>${esc(body.duration)}</w:t></w:r></w:p>`,
  ].filter(Boolean).join('\n')

  const sections = body.stages
    .filter((s) => s.content.trim())
    .map((s) => [
      `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>${esc(stageHeading(s))}</w:t></w:r></w:p>`,
      ...s.content.trim().split('\n\n').map((para) => paraXml(para)),
    ].join('\n'))
    .join('\n<w:p/>\n')

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>
${title}
${meta}
<w:p/>
${sections}
<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1800"/></w:sectPr>
</w:body>
</w:document>`

  return buildZip([
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    },
    {
      name: 'word/_rels/document.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`,
    },
    { name: 'word/document.xml', content: docXml },
  ])
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as ExportBody | null
  if (!body?.format || !body.title || !Array.isArray(body.stages)) {
    return Response.json({ error: 'format, title, and stages are required' }, { status: 400 })
  }

  if (body.format === 'pdf') {
    const html = buildPdfHtml(body)
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${(body.filename ?? 'script').replace(/"/g, '')}.html"`,
      },
    })
  }

  if (body.format === 'docx') {
    const docxBuf = buildDocx(body)
    return new Response(docxBuf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${(body.filename ?? 'script').replace(/"/g, '')}.docx"`,
      },
    })
  }

  return Response.json({ error: `Unsupported format: ${String(body.format)}` }, { status: 400 })
}

// Suppress unused import warning — gzipSync is available if needed for future compression
void gzipSync
