import { BRAND_COLOR } from '@/lib/brand'
import { cn } from '@/lib/utils'

/** Square frame: Spotify 1:1 fills the card; 1920×1080 sits letterboxed, uncropped. */
export function ProductionCoverArt({
  src,
  color,
  name,
  className,
}: {
  src?: string | null
  color?: string | null
  name?: string
  className?: string
}) {
  const bg = color || BRAND_COLOR
  return (
    <div className={cn('relative aspect-square w-full overflow-hidden', className)} style={{ background: bg }}>
      {src ? (
        <img src={src} alt="" className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="select-none text-4xl font-bold text-white/90">{name?.trim().slice(0, 1) || '•'}</span>
        </div>
      )}
    </div>
  )
}
