/**
 * GET /api/marketplace/feed
 * Phase S3 — Serve the marketplace skill catalog.
 *
 * Returns the built-in catalog for S3.
 * Production upgrade path: fetch from a CDN/API using MARKETPLACE_FEED_SOURCE env var.
 *
 * Skills included:
 * - All three official first-party skills (Standard, Auteur, Series)
 * - Placeholder community skills showing the discovery surface
 */
import { SKILL_MANIFESTS } from '@/lib/flow-types'
import type { MarketplaceFeed, MarketplaceSkill } from '@/lib/marketplace'

// Build official entries from existing manifests
const OFFICIAL: MarketplaceSkill[] = Object.values(SKILL_MANIFESTS).map((m, i) => ({
  listingId: `official-${m.skillId}`,
  manifest: m,
  instructions: '',   // instructions are loaded server-side from public/skills/
  trustTier: 'official' as const,
  family: m.skillId.includes('auteur') ? 'script'
        : m.skillId.includes('series') ? 'script'
        : 'script' as const,
  downloads: [4821, 2934, 1102][i] ?? 500,
  rating: [4.9, 4.8, 4.6][i],
  tags: m.skillId.includes('auteur') ? ['cinematic', 'generative', 'continuity']
       : m.skillId.includes('series') ? ['series', 'episodic', 'continuity']
       : ['brand', 'social', 'education'],
  previewNodes: m.nodes.slice(0, 3).map((n) => ({
    label: n.title ?? n.key,
    content: `[${n.kind ?? n.type}] ${n.key}`,
  })),
  publishedAt: '2025-01-01T00:00:00Z',
  price: 'free' as const,
  publisherName: 'ScriptFlora',
  publisherVerified: true,
}))

// Placeholder community skills (demonstrate the discovery UI)
const COMMUNITY: MarketplaceSkill[] = [
  {
    listingId: 'community-noir-auteur',
    manifest: {
      skillId: 'community.noir-auteur',
      version: '0.9.0',
      publisherId: 'noir-collective',
      name: 'Noir Auteur Short',
      tagline: 'Dialogue-heavy noir short structure with style bias toward low-key lighting and moral ambiguity.',
      stages: '5 stages',
      source: 'marketplace',
      changelog: 'Initial release.',
      permissions: ['read:brief', 'read:style', 'write:skill_nodes'],
      requires: { briefConfirmed: true },
      nodes: [
        { key: 'opening', type: 'content', kind: 'auteur-stageplay', title: 'Opening scene' },
        { key: 'turn',    type: 'content', kind: 'auteur-screenplay', title: 'The turn', dependsOn: ['opening'] },
        { key: 'reveal',  type: 'content', kind: 'auteur-technical',  title: 'Reveal', dependsOn: ['turn'] },
        { key: 'close',   type: 'content', kind: 'auteur-script',     title: 'Close', dependsOn: ['reveal'] },
      ],
    },
    instructions: '',
    trustTier: 'community',
    family: 'script',
    downloads: 342,
    rating: 4.2,
    tags: ['noir', 'cinematic', 'dialogue', 'short'],
    previewNodes: [
      { label: 'Opening scene', content: 'auteur-stageplay: Hard rain. Interior.' },
      { label: 'The turn', content: 'auteur-screenplay: She turns the envelope over.' },
    ],
    publishedAt: '2025-06-01T00:00:00Z',
    price: 'free',
    publisherName: 'noir-collective',
    publisherVerified: false,
  },
  {
    listingId: 'community-explainer-30s',
    manifest: {
      skillId: 'community.explainer-30s',
      version: '1.1.0',
      publisherId: 'edu-tools',
      name: 'Explainer 30s',
      tagline: 'Tight 30-second explainer structure with hook, single key point, and strong CTA.',
      stages: '3 stages',
      source: 'marketplace',
      changelog: '1.1: improved CTA templates.',
      permissions: ['read:brief', 'write:skill_nodes'],
      requires: { briefConfirmed: true },
      nodes: [
        { key: 'hook',    type: 'content', kind: 'hook',    title: 'Hook (5s)' },
        { key: 'point',   type: 'content', kind: 'scene',   title: 'Key point (20s)', dependsOn: ['hook'] },
        { key: 'cta',     type: 'content', kind: 'cta',     title: 'CTA (5s)', dependsOn: ['point'] },
      ],
    },
    instructions: '',
    trustTier: 'community',
    family: 'structure',
    downloads: 891,
    rating: 4.5,
    tags: ['explainer', '30s', 'social', 'tight'],
    previewNodes: [
      { label: 'Hook (5s)', content: 'hook: The fastest way to explain your product.' },
      { label: 'CTA (5s)', content: 'cta: Try it free for 14 days.' },
    ],
    publishedAt: '2025-04-15T00:00:00Z',
    price: 'free',
    publisherName: 'edu-tools',
    publisherVerified: true,
  },
]

const FEED: MarketplaceFeed = {
  version: '1.0',
  updatedAt: new Date().toISOString(),
  skills: [...OFFICIAL, ...COMMUNITY],
}

export async function GET() {
  // In production: fetch from MARKETPLACE_FEED_SOURCE and merge/verify
  return Response.json(FEED, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
  })
}
