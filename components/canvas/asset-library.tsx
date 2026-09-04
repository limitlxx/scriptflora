'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  AlertCircle, Check, Music, Package, Trash2, Upload, X, Image as ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  loadAssets, saveAsset, deleteAsset, fileToAsset, formatBytes,
  ASSET_TYPE_LABELS, ASSET_ACCEPT,
  type AssetType, type ProjectAsset,
} from '@/lib/assets'

const TYPE_OPTIONS: { id: AssetType; label: string; hint: string }[] = [
  { id: 'brand',         label: 'Brand',         hint: 'Logo, wordmark, colour swatch' },
  { id: 'overlay',       label: 'Overlay',        hint: 'Lower third, bug, end card frame' },
  { id: 'audio',         label: 'Audio',          hint: 'Music bed, SFX, ambience' },
  { id: 'template_part', label: 'Template part',  hint: 'HyperFrames template component' },
]

const TYPE_ICON: Record<AssetType, React.ComponentType<{ className?: string }>> = {
  brand: ImageIcon,
  overlay: Package,
  audio: Music,
  template_part: Package,
}

function AssetCard({
  asset,
  onDelete,
  onCopyId,
}: {
  asset: ProjectAsset
  onDelete: () => void
  onCopyId: () => void
}) {
  const [copied, setCopied] = useState(false)
  const Icon = TYPE_ICON[asset.type]
  const isImage = asset.mimeType.startsWith('image/')
  const isAudio = asset.mimeType.startsWith('audio/')

  const handleCopy = () => {
    void navigator.clipboard.writeText(asset.id)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20">
      {/* Preview */}
      {isImage && (
        <div className="overflow-hidden rounded-t-xl border-b border-white/[0.06]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.dataUrl} alt={asset.name} className="h-20 w-full object-contain bg-black/30" />
        </div>
      )}
      {isAudio && (
        <div className="border-b border-white/[0.06] px-3 py-2">
          <audio src={asset.dataUrl} controls className="h-8 w-full" aria-label={asset.name} />
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-white/[0.07] bg-black/20">
            <Icon className="size-3 text-muted-foreground/70" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11.5px] font-medium text-foreground/90">{asset.name}</p>
            <p className="text-[10px] text-muted-foreground/60">
              {ASSET_TYPE_LABELS[asset.type]} · {formatBytes(asset.sizeBytes)}
            </p>
          </div>
        </div>

        {/* Tags */}
        {asset.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {asset.tags.map((t) => (
              <span key={t} className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9.5px] text-muted-foreground/70">{t}</span>
            ))}
          </div>
        )}

        {/* Asset ID + actions */}
        <div className="mt-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy asset ID for use in HyperFrames variables"
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-black/20 px-2 py-1 text-left transition-colors hover:border-primary/25"
          >
            <span className="truncate font-mono text-[9.5px] text-muted-foreground/60">{asset.id}</span>
            {copied
              ? <Check className="size-2.5 shrink-0 text-success" />
              : <span className="shrink-0 text-[9px] text-muted-foreground/40">copy</span>
            }
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete asset"
            className="flex size-6 shrink-0 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-destructive transition-colors"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AssetLibrary({ projectId }: { projectId: string }) {
  const [assets, setAssets] = useState<ProjectAsset[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadType, setUploadType] = useState<AssetType>('brand')
  const [licenseNotes, setLicenseNotes] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all')
  const fileRef = useRef<HTMLInputElement>(null)

  const reload = () => setAssets(loadAssets(projectId))

  useEffect(() => {
    reload()
    const sync = (e: Event) => {
      if ((e as CustomEvent).detail?.projectId === projectId) reload()
    }
    window.addEventListener('sf:assets:change', sync)
    return () => window.removeEventListener('sf:assets:change', sync)
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setError('')
    try {
      for (const file of Array.from(files)) {
        // Warn on large files but don't block — let user decide
        if (file.size > 5 * 1024 * 1024) {
          setError(`"${file.name}" is ${formatBytes(file.size)} — large files may slow your browser. Consider compressing before uploading.`)
        }
        const asset = await fileToAsset(file, projectId, uploadType, licenseNotes, tags)
        saveAsset(asset)
      }
      setLicenseNotes('')
      setTags([])
      setTagInput('')
      reload()
    } catch {
      setError('Upload failed. Try a different file.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }

  const filtered = filterType === 'all' ? assets : assets.filter((a) => a.type === filterType)

  return (
    <div className="flex flex-col gap-3">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1">
        {(['all', ...TYPE_OPTIONS.map((t) => t.id)] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            className={cn(
              'rounded-md border px-2 py-0.5 text-[10px] transition-all',
              filterType === type
                ? 'border-primary/45 bg-accent-muted text-primary'
                : 'border-white/[0.07] text-muted-foreground hover:text-foreground',
            )}
          >
            {type === 'all' ? 'All' : ASSET_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Asset list */}
      {filtered.length === 0 ? (
        <p className="py-2 text-center text-[10.5px] text-muted-foreground/60">
          {filterType === 'all' ? 'No assets yet.' : `No ${ASSET_TYPE_LABELS[filterType]} assets.`}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onDelete={() => { deleteAsset(projectId, asset.id); reload() }}
              onCopyId={() => {}}
            />
          ))}
        </div>
      )}

      {/* Upload form */}
      <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3 space-y-2.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">Upload asset</p>

        {/* Type picker */}
        <div className="flex flex-wrap gap-1">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setUploadType(opt.id)}
              title={opt.hint}
              className={cn(
                'rounded-md border px-2 py-0.5 text-[10px] transition-all',
                uploadType === opt.id
                  ? 'border-primary/45 bg-accent-muted text-primary'
                  : 'border-white/[0.07] text-muted-foreground hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Tags */}
        <div className="flex gap-1.5">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
            placeholder="Add tag, press Enter"
            className="flex-1 rounded-lg border border-white/[0.07] bg-black/20 px-2 py-1 text-[10.5px] text-foreground/80 outline-none placeholder:text-muted-foreground/40 focus:border-primary/35"
          />
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[9.5px] text-primary">
                {t}
                <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}>
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* License notes */}
        <input
          value={licenseNotes}
          onChange={(e) => setLicenseNotes(e.target.value)}
          placeholder="License / usage notes (optional)"
          className="w-full rounded-lg border border-white/[0.07] bg-black/20 px-2 py-1 text-[10.5px] text-foreground/80 outline-none placeholder:text-muted-foreground/40 focus:border-primary/35"
        />

        {/* Error */}
        {error && (
          <div className="flex items-start gap-1.5 rounded-lg border border-warning/25 bg-warning/8 px-2 py-1.5">
            <AlertCircle className="mt-0.5 size-3 shrink-0 text-warning" />
            <p className="text-[10px] text-warning/90 leading-snug">{error}</p>
          </div>
        )}

        {/* Upload button */}
        <label className={cn(
          'flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.12] py-2.5',
          'text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground',
          uploading && 'pointer-events-none opacity-50',
        )}>
          <Upload className="size-3.5" />
          {uploading ? 'Uploading…' : `Upload ${ASSET_TYPE_LABELS[uploadType]}`}
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={ASSET_ACCEPT[uploadType]}
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => void handleFiles(e.target.files)}
          />
        </label>
        <p className="text-center text-[9.5px] text-muted-foreground/40">
          Not injected into generation prompts — packaging assets only
        </p>
      </div>
    </div>
  )
}
