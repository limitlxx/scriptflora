'use client'

/**
 * Phase 10 — Project-level Asset Library.
 * Stores brand assets (logos, overlays, audio beds, motion graphic parts)
 * keyed by project ID.
 *
 * Separate namespace from Character Bible image refs — these are packaging
 * assets, NOT generative identity refs. Never auto-injected into shot prompts.
 *
 * ponytail: localStorage + base64 data URLs covers Phase 10.
 * Ceiling: large media files (> ~5 MB) will bloat localStorage.
 * Upgrade path: swap dataUrl for a signed cloud storage URL when a file
 * store is added.
 */

import { nanoid } from 'nanoid'

export type AssetType = 'brand' | 'overlay' | 'audio' | 'template_part'

export type ProjectAsset = {
  id: string
  projectId: string
  name: string
  type: AssetType
  /** MIME type e.g. "image/png", "audio/mp3" */
  mimeType: string
  /** Base64 data URL — see ceiling note above */
  dataUrl: string
  /** File size in bytes (for display) */
  sizeBytes: number
  /** Free-form license / usage notes */
  licenseNotes: string
  tags: string[]
  createdAt: string
}

function key(projectId: string) {
  return `sf:assets:${projectId}`
}

export function loadAssets(projectId: string): ProjectAsset[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(key(projectId)) ?? '[]') as ProjectAsset[]
  } catch {
    return []
  }
}

export function saveAsset(asset: ProjectAsset): void {
  const existing = loadAssets(asset.projectId).filter((a) => a.id !== asset.id)
  localStorage.setItem(key(asset.projectId), JSON.stringify([...existing, asset]))
  window.dispatchEvent(new CustomEvent('sf:assets:change', { detail: { projectId: asset.projectId } }))
}

export function deleteAsset(projectId: string, assetId: string): void {
  const assets = loadAssets(projectId).filter((a) => a.id !== assetId)
  localStorage.setItem(key(projectId), JSON.stringify(assets))
  window.dispatchEvent(new CustomEvent('sf:assets:change', { detail: { projectId } }))
}

export function getAssetById(projectId: string, assetId: string): ProjectAsset | null {
  return loadAssets(projectId).find((a) => a.id === assetId) ?? null
}

/** Read a File object and return a ready-to-save ProjectAsset */
export async function fileToAsset(
  file: File,
  projectId: string,
  type: AssetType,
  licenseNotes = '',
  tags: string[] = [],
): Promise<ProjectAsset> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  return {
    id: nanoid(10),
    projectId,
    name: file.name,
    type,
    mimeType: file.type || 'application/octet-stream',
    dataUrl,
    sizeBytes: file.size,
    licenseNotes,
    tags,
    createdAt: new Date().toISOString(),
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  brand: 'Brand',
  overlay: 'Overlay',
  audio: 'Audio',
  template_part: 'Template part',
}

export const ASSET_ACCEPT: Record<AssetType, string> = {
  brand: 'image/png,image/svg+xml,image/jpeg,image/webp',
  overlay: 'image/png,image/svg+xml,video/mp4,video/webm',
  audio: 'audio/mpeg,audio/mp4,audio/wav,audio/ogg',
  template_part: 'image/png,image/svg+xml,application/json,text/plain',
}
