'use client'

import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { DragEvent, useRef, useState } from 'react'

import { ProductionCoverArt } from '@/components/ProductionCoverArt'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PRODUCTION_FIELDS } from '@/lib/collectionMeta'
import { cn } from '@/lib/utils'

export function CoverImageUpload({
  previewUrl,
  color,
  name,
  uploading,
  onFile,
  onRemove,
}: {
  previewUrl: string | null
  color?: string | null
  name?: string
  uploading: boolean
  onFile: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const hint = PRODUCTION_FIELDS.coverImage

  function pick(file?: File | null) {
    if (!file || !file.type.startsWith('image/')) return
    onFile(file)
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragging(false)
    pick(e.dataTransfer.files[0])
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="coverImage">{hint.label}</Label>
      <p className="text-xs text-muted-foreground">
        {hint.descriptionHe}
        <br />
        {hint.descriptionEn}
      </p>
      <label
        htmlFor="coverImage"
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative mx-auto block w-full max-w-sm cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-colors',
          dragging ? 'border-primary' : 'border-input hover:border-primary/50',
          uploading && 'pointer-events-none opacity-70',
        )}
      >
        <ProductionCoverArt src={previewUrl} color={color} name={name} />
        {!previewUrl ? (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/25 px-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
              <ImagePlus className="h-6 w-6 text-primary" />
            </span>
            <span className="text-sm font-medium text-white">גרור תמונה לכאן או לחץ לבחירה</span>
            <span className="text-xs text-white/85">1:1 Spotify · או 1920×1080</span>
          </span>
        ) : null}
        {previewUrl && !uploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100">
            החלף תמונה
          </span>
        ) : null}
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </span>
        ) : null}
        <input
          ref={inputRef}
          id="coverImage"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploading}
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </label>
      {previewUrl ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={uploading}
          onClick={() => {
            if (inputRef.current) inputRef.current.value = ''
            onRemove()
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          הסר תמונה
        </Button>
      ) : null}
    </div>
  )
}
