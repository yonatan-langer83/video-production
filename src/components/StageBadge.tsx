import { cn } from '@/lib/utils'
import {
  PIPELINE_BADGE_CLASS,
  PIPELINE_LABELS,
  isPipelineStage,
  type PipelineStage,
} from '@/lib/pipeline'

export function StageBadge({
  stage,
  count,
  className,
}: {
  stage?: string | null
  count?: number
  className?: string
}) {
  const value: PipelineStage = isPipelineStage(stage) ? stage : 'schedule_shoot'
  const label = PIPELINE_LABELS[value]
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        PIPELINE_BADGE_CLASS[value],
        className,
      )}
    >
      <span className="min-w-0 truncate">
        {label.he}
        <span className="ms-1 font-normal opacity-70">/ {label.en}</span>
      </span>
      {count != null ? (
        <span className="ms-1.5 inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-black/10 px-1.5 text-[11px] font-bold">
          {count}
        </span>
      ) : null}
    </span>
  )
}
