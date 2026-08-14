import type { AppUser } from '@/access'

export const PIPELINE_STAGES = [
  'planned',
  'to_film',
  'filmed',
  'subtitling',
  'editing',
  'review',
  'published',
] as const

export type PipelineStage = (typeof PIPELINE_STAGES)[number]

export const PIPELINE_LABELS: Record<PipelineStage, { he: string; en: string }> = {
  planned: { he: 'בתכנון', en: 'Planned' },
  to_film: { he: 'מוכן לצילום', en: 'To film' },
  filmed: { he: 'צולם', en: 'Filmed' },
  subtitling: { he: 'בתמלול', en: 'Subtitling' },
  editing: { he: 'בעריכה', en: 'Editing' },
  review: { he: 'לבדיקה', en: 'Review' },
  published: { he: 'פורסם', en: 'Published' },
}

export const PIPELINE_BADGE_CLASS: Record<PipelineStage, string> = {
  planned: 'bg-slate-100 text-slate-800',
  to_film: 'bg-sky-100 text-sky-800',
  filmed: 'bg-violet-100 text-violet-800',
  subtitling: 'bg-amber-100 text-amber-900',
  editing: 'bg-orange-100 text-orange-800',
  review: 'bg-pink-100 text-pink-800',
  published: 'bg-emerald-100 text-emerald-800',
}

export function isPipelineStage(value: unknown): value is PipelineStage {
  return typeof value === 'string' && (PIPELINE_STAGES as readonly string[]).includes(value)
}

export function stageIndex(stage: PipelineStage): number {
  return PIPELINE_STAGES.indexOf(stage)
}

export function isBackwardMove(from: PipelineStage, to: PipelineStage): boolean {
  return stageIndex(to) < stageIndex(from)
}

const ROLE_TRANSITIONS: Record<string, Array<[PipelineStage, PipelineStage]>> = {
  editor: [
    ['subtitling', 'editing'],
    ['editing', 'review'],
    ['review', 'editing'],
  ],
  subtitler: [
    ['filmed', 'subtitling'],
    ['subtitling', 'filmed'],
    ['subtitling', 'editing'],
    ['editing', 'subtitling'],
  ],
  av_manager: [
    ['planned', 'to_film'],
    ['to_film', 'planned'],
    ['to_film', 'filmed'],
    ['filmed', 'to_film'],
  ],
}

export function canMoveStage(
  user: AppUser | null | undefined,
  from: PipelineStage | null | undefined,
  to: PipelineStage,
): boolean {
  if (!user?.role) return false
  if (!isPipelineStage(to)) return false
  if (from === to) return true
  if (user.role === 'admin' || user.role === 'project_manager') return true
  if (!from) return false
  const allowed = ROLE_TRANSITIONS[user.role] || []
  return allowed.some(([a, b]) => a === from && b === to)
}

export function allowedNextStages(
  user: AppUser | null | undefined,
  from: PipelineStage | null | undefined,
): PipelineStage[] {
  if (!user?.role) return []
  if (user.role === 'admin' || user.role === 'project_manager') {
    return PIPELINE_STAGES.filter((s) => s !== from)
  }
  const allowed = ROLE_TRANSITIONS[user.role] || []
  return allowed.filter(([a]) => a === from).map(([, b]) => b)
}

export const BOARD_STAGES: PipelineStage[] = PIPELINE_STAGES.filter((s) => s !== 'published')

export function queueStagesForRole(role: AppUser['role'] | undefined): PipelineStage[] {
  switch (role) {
    case 'editor':
      return ['editing', 'review']
    case 'subtitler':
      return ['filmed', 'subtitling']
    case 'av_manager':
      return ['planned', 'to_film', 'filmed']
    default:
      return [...BOARD_STAGES]
  }
}

export function boardStagesForRole(role: AppUser['role'] | undefined): PipelineStage[] {
  return queueStagesForRole(role)
}
