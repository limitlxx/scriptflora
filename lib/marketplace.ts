'use client'

/**
 * Phase S3 — Public Skills Marketplace types and client helpers.
 *
 * The marketplace feed is a JSON array served by /api/marketplace/feed.
 * In S3 the feed is a static built-in catalog.
 * Upgrade path: point NEXT_PUBLIC_MARKETPLACE_FEED_URL at a live API for M3.
 *
 * ponytail: no payment integration in v1 — free + official skills only.
 * Commerce layer can be added later without changing the install flow.
 */

import type { SkillManifest } from './flow-types'
import type { TrustTier, SkillFamily } from './skill-library'

// ── Marketplace listing ──────────────────────────────────────────

export type MarketplaceSkill = {
  listingId: string
  manifest: SkillManifest
  /** Full instructions bundled with the listing */
  instructions: string
  trustTier: TrustTier
  family: SkillFamily
  downloads: number
  rating?: number         // 0–5, optional
  tags: string[]
  previewNodes: Array<{ label: string; content: string }>
  publishedAt: string
  price: 'free' | number  // 'free' or USD cents
  publisherName: string
  publisherVerified: boolean
}

export type MarketplaceFeed = {
  version: '1.0'
  updatedAt: string
  skills: MarketplaceSkill[]
}

// ── Client helpers ───────────────────────────────────────────────

export async function fetchMarketplaceFeed(): Promise<MarketplaceFeed | null> {
  try {
    const url = process.env.NEXT_PUBLIC_MARKETPLACE_FEED_URL ?? '/api/marketplace/feed'
    const res = await fetch(url, { next: { revalidate: 300 } }) // 5 min cache
    if (!res.ok) return null
    return await res.json() as MarketplaceFeed
  } catch {
    return null
  }
}

export function filterSkills(
  skills: MarketplaceSkill[],
  opts: { query?: string; family?: SkillFamily | 'all'; tier?: TrustTier | 'all'; sort?: 'popular' | 'newest' | 'rating' }
): MarketplaceSkill[] {
  let result = [...skills]

  if (opts.query?.trim()) {
    const q = opts.query.toLowerCase()
    result = result.filter((s) =>
      s.manifest.name.toLowerCase().includes(q) ||
      s.manifest.tagline.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    )
  }

  if (opts.family && opts.family !== 'all') {
    result = result.filter((s) => s.family === opts.family)
  }

  if (opts.tier && opts.tier !== 'all') {
    result = result.filter((s) => s.trustTier === opts.tier)
  }

  if (opts.sort === 'popular') result.sort((a, b) => b.downloads - a.downloads)
  else if (opts.sort === 'rating') result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  else result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  return result
}
