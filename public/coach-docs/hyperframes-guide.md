# HyperFrames Guide — ScriptFlora

## What is HyperFrames?
HyperFrames is the packaging step — it turns approved clips from your Timeline/Sequence into a designed deliverable video using HTML composition templates.

It is **not** a scene generator. It does not write scripts or generate new footage. It packages what you've already approved.

## When to use it
After: Brief → Script → Shots → Generate Shot → Result (approved) → Timeline/Sequence

## Built-in templates
- **explainer_16x9** — title block, subtitle, CTA, logo, dark overlay, 1920×1080
- **ad_endcard_16x9** — video clips + CSS-animated end card with brand colour, 1920×1080
- **social_9x16** — safe-area bottom text, vertical format, 1080×1920
- **training_module** — header bar, side panel, key fact callout, presenter credit, 1920×1080

## Variables you can set
- title, subtitle, CTA text
- logoUrl (use Asset Library to get the URL)
- primaryColor (hex or oklch value)
- presenter name (for training_module)
- Custom key/value pairs for any template variable

## Workflow
1. Add a HyperFrames node to the canvas
2. Pick a template
3. Set variables (title, logo, CTA, etc.)
4. Click "Sync clips from Timeline" to pull in your approved clips
5. Click "Preview composition" to see the HTML template with your variables live
6. Click "Render" to submit to HeyGen cloud (requires HEYGEN_API_KEY) or local CLI (HYPERFRAMES_LOCAL=true)
7. Approve or reject the rendered output

## Rendering options
- **HeyGen cloud**: set HEYGEN_API_KEY in .env.local; submits to POST /v3/hyperframes/renders
- **Local CLI**: set HYPERFRAMES_LOCAL=true; uses `npx hyperframes render`
- **Simulated**: no key set; returns a simulated result for testing

## Assets for packaging
Put logos, overlays, and brand images in the Asset Library (left sidebar → Assets tab). Copy the asset ID/URL from there and paste it into the HyperFrames variable editor.
