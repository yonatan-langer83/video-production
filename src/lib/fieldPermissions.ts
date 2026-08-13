import type { AppUser } from '@/access'
import {
  getFormFieldEntries,
  getEpisodeFieldDef,
  isFieldVisible,
  type EpisodeFieldDef,
  type ProductionFieldConfig,
} from '@/lib/episodeFields'
import type { Production, VideoProject } from '@/payload-types'

export function resolveRelId(field: unknown): number | string | null {
  if (!field) return null
  if (typeof field === 'object' && field !== null && 'id' in field) {
    return (field as { id: number | string }).id
  }
  if (typeof field === 'number' || typeof field === 'string') return field
  return null
}

export function resolveProductionFromEpisode(
  episode: VideoProject | null | undefined,
  productionOverride?: Production | ProductionFieldConfig | null,
): ProductionFieldConfig | null {
  if (productionOverride) return productionOverride
  if (!episode?.production) return null
  if (typeof episode.production === 'object' && episode.production !== null) {
    return episode.production as Production
  }
  return null
}

function isAssignedOnEpisode(
  episode: VideoProject,
  user: AppUser,
  assignKey: 'editor' | 'subtitler',
): boolean {
  const assignedId = resolveRelId(episode[assignKey])
  return assignedId !== null && String(assignedId) === String(user.id)
}

function passesAssignment(
  episode: VideoProject,
  user: AppUser,
  assign?: 'editor' | 'subtitler' | 'editor_or_subtitler',
): boolean {
  if (!assign) return true
  if (assign === 'editor_or_subtitler') {
    return isAssignedOnEpisode(episode, user, 'editor') || isAssignedOnEpisode(episode, user, 'subtitler')
  }
  return isAssignedOnEpisode(episode, user, assign)
}

function passesProductionEditable(
  production: ProductionFieldConfig | null | undefined,
  fieldKey: string,
  user: AppUser,
): boolean {
  const editable = production?.editableEpisodeFields
  if (!editable || editable.length === 0) return true
  if (user.role === 'admin' || user.role === 'project_manager') return true
  return editable.map(String).includes(fieldKey)
}

const EPISODE_FIELD_KEYS = [
  'episodeNumber',
  'title',
  'status',
  'pipelineStage',
  'description',
  'requirements',
  'filmedAt',
  'shootSetup',
  'setupNotes',
  'shootToEditorNotes',
  'driveFolderUrl',
  'needsSubtitling',
  'vimeoBeforeSubtitling',
  'movedToKapwingArchive',
  'vimeoReadyFolderUrl',
  'editingShiftUpdate',
  'editingNotes',
  'publishedAt',
  'duration',
  'vimeoUrl',
  'vimeoFolderUrl',
  'spotifyUrl',
  'youtubeUrl',
  'short1Url',
  'short2Url',
  'short3Url',
  'audioUrl',
  'srtUrl',
  'projectManager',
  'editor',
  'subtitler',
  'wordpressPermalink',
] as const

export function canEditField({
  user,
  production,
  episode,
  fieldKey,
}: {
  user: AppUser | null | undefined
  production: ProductionFieldConfig | null | undefined
  episode: VideoProject | null | undefined
  fieldKey: string
}): boolean {
  if (!user || !episode) return false
  if (!isFieldVisible(production, fieldKey)) return false

  const def = getEpisodeFieldDef(fieldKey)
  if (!def || def.virtual) return false

  if (!passesProductionEditable(production, fieldKey, user)) return false

  if (user.role === 'admin' || user.role === 'project_manager') return true

  if (!user.role || !def.editRoles.includes(user.role)) return false

  return passesAssignment(episode, user, def.editWhenAssigned)
}

export function canEditAnyField({
  user,
  production,
  episode,
}: {
  user: AppUser | null | undefined
  production: ProductionFieldConfig | null | undefined
  episode: VideoProject | null | undefined
}): boolean {
  if (!user || !episode) return false
  return EPISODE_FIELD_KEYS.some((key) => canEditField({ user, production, episode, fieldKey: key }))
}

export function filterEditablePatch({
  user,
  production,
  episode,
  data,
}: {
  user: AppUser
  production: ProductionFieldConfig | null | undefined
  episode: VideoProject
  data: Record<string, unknown>
}): Partial<VideoProject> {
  const filtered: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (key === 'production' || key === 'category') {
      if (user.role === 'admin' || user.role === 'project_manager') {
        filtered[key] = value
      }
      continue
    }
    if (canEditField({ user, production, episode, fieldKey: key })) {
      filtered[key] = value
    }
  }
  return filtered as Partial<VideoProject>
}

export function canManageAdmin(user: AppUser | null | undefined): boolean {
  return user?.role === 'admin' || user?.role === 'project_manager'
}

export function canCreateEpisode(user: AppUser | null | undefined): boolean {
  return user?.role === 'admin' || user?.role === 'project_manager'
}

export function getEditableFormFields(
  production: ProductionFieldConfig | null | undefined,
  user?: AppUser | null,
  episode?: VideoProject | null,
): Array<{ field: EpisodeFieldDef; editable: boolean }> {
  return getFormFieldEntries(production, (key) =>
    user && episode ? canEditField({ user, production, episode, fieldKey: key }) : true,
  )
}
