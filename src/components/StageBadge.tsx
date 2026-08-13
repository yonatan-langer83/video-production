import { cn } from '@/lib/utils'
import {
  PIPELINE_BADGE_CLASS,
  PIPELINE_LABELS,
  isPipelineStage,
  type PipelineStage,
} from '@/lib/pipeline'

export function StageBadge({ stage, className }: { stage?: string | null; className?: string }) {
  const value: PipelineStage = isPipelineStage(stage) ? stage : 'planned'
  const label = PIPELINE_LABELS[value]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        PIPELINE_BADGE_CLASS[value],
        className,
      )}
    >
      {label.he}
      <span className="ms-1 font-normal opacity-70">/ {label.en}</span>
    </span>
  )
}
