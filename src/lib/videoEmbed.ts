export function extractVimeoId(url?: string | null): string | null {
  if (!url) return null
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match?.[1] ?? null
}

export function formatTimecode(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export function mediaUrl(file: unknown): string | null {
  if (!file) return null
  if (typeof file === 'string') return file
  if (typeof file === 'object' && file !== null && 'url' in file) {
    return String((file as { url?: string }).url || '') || null
  }
  return null
}
