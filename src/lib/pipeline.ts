import type { AppUser } from '@/access'

export const PIPELINE_STAGES = [
  'schedule_shoot',
  'filming',
  'prep_editing',
  'editing',
  'capwing',
  'capwing_old',
  'done',
  'published',
] as const

export type PipelineStage = (typeof PIPELINE_STAGES)[number]

export const DEFAULT_PIPELINE_STAGE: PipelineStage = 'schedule_shoot'

export const PIPELINE_LABELS: Record<PipelineStage, { he: string; en: string }> = {
  schedule_shoot: { he: 'קביעת יום צילום', en: 'Schedule shoot day' },
  filming: { he: 'צילום', en: 'Filming' },
  prep_editing: { he: 'הכנה לעריכה', en: 'Prep for editing' },
  editing: { he: 'עריכה', en: 'Editing' },
  capwing: { he: 'עלה לקאפ ווינג', en: 'Uploaded to CapWing' },
  capwing_old: { he: 'עבר לתיקייה ישן בקאפ ווינג', en: 'CapWing old folder' },
  done: { he: 'גמור', en: 'Done' },
  published: { he: 'פורסם', en: 'Published' },
}

export const PIPELINE_BADGE_CLASS: Record<PipelineStage, string> = {
  schedule_shoot: 'bg-slate-100 text-slate-800',
  filming: 'bg-sky-100 text-sky-800',
  prep_editing: 'bg-violet-100 text-violet-800',
  editing: 'bg-orange-100 text-orange-800',
  capwing: 'bg-amber-100 text-amber-900',
  capwing_old: 'bg-yellow-100 text-yellow-900',
  done: 'bg-teal-100 text-teal-800',
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
    ['prep_editing', 'editing'],
    ['editing', 'prep_editing'],
    ['editing', 'capwing'],
    ['capwing', 'editing'],
  ],
  subtitler: [
    ['capwing', 'capwing_old'],
    ['capwing_old', 'capwing'],
    ['capwing_old', 'done'],
    ['done', 'capwing_old'],
  ],
  av_manager: [
    ['schedule_shoot', 'filming'],
    ['filming', 'schedule_shoot'],
    ['filming', 'prep_editing'],
    ['prep_editing', 'filming'],
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

export function queueStagesForRole(role?: string | null): PipelineStage[] {
  switch (role) {
    case 'editor':
      return ['prep_editing', 'editing']
    case 'subtitler':
      return ['capwing', 'capwing_old']
    case 'av_manager':
      return ['schedule_shoot', 'filming', 'prep_editing']
    default:
      return [...BOARD_STAGES]
  }
}

export function boardStagesForRole(role?: string | null): PipelineStage[] {
  return queueStagesForRole(role)
}
