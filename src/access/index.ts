import type { Access, FieldAccess, PayloadRequest } from 'payload'

import { canEditAnyField, canEditField, resolveProductionFromEpisode, resolveRelId } from '@/lib/fieldPermissions'
import type { Production, VideoProject } from '@/payload-types'

export type AppUser = {
  id: number | string
  collection: 'users'
  email: string
  role?: 'admin' | 'project_manager' | 'editor' | 'subtitler' | 'av_manager'
}

export function asAppUser(user: PayloadRequest['user']): AppUser | null {
  if (!user || user.collection !== 'users') return null
  return user as AppUser
}

export const isLoggedIn: Access = ({ req }) => Boolean(asAppUser(req.user))

export const isAdmin: Access = ({ req }) => asAppUser(req.user)?.role === 'admin'

export const isAdminOrPM: Access = ({ req }) => {
  const role = asAppUser(req.user)?.role
  return role === 'admin' || role === 'project_manager'
}

export const isAdminOrPmOrAv: Access = ({ req }) => {
  const role = asAppUser(req.user)?.role
  return role === 'admin' || role === 'project_manager' || role === 'av_manager'
}

export const canUsePayloadAdmin: Access = ({ req }) => {
  const role = asAppUser(req.user)?.role
  return role === 'admin' || role === 'project_manager'
}

export const canManageUsers: Access = ({ req }) => asAppUser(req.user)?.role === 'admin'

export const canManageCategories: Access = ({ req }) => isAdminOrPM({ req })

export const canReadProjects: Access = ({ req }) => Boolean(asAppUser(req.user))

export const canCreateProjects: Access = ({ req }) => isAdminOrPM({ req })

export const canDeleteProjects: Access = ({ req }) => isAdminOrPM({ req })

export const canUpdateProjects: Access = async ({ req, id, data }) => {
  const user = asAppUser(req.user)
  if (!user) return false
  if (user.role === 'admin' || user.role === 'project_manager') return true
  if (!id) return false

  try {
    const doc = await req.payload.findByID({
      collection: 'video-projects',
      id,
      depth: 1,
      overrideAccess: true,
    })
    let production = resolveProductionFromEpisode(doc)
    if (!production && doc.production) {
      const prodId = resolveRelId(doc.production)
      if (prodId) {
        production = (await req.payload.findByID({
          collection: 'productions',
          id: prodId,
          depth: 0,
          overrideAccess: true,
        })) as Production
      }
    }
    const episode = { ...doc, ...data } as VideoProject
    return canEditAnyField({ user, production, episode })
  } catch {
    return false
  }
}

export const canReadNotifications: Access = ({ req }) => {
  const user = asAppUser(req.user)
  if (!user) return false
  return { recipient: { equals: user.id } }
}

export const editingFields = [
  'editingShiftUpdate',
  'editingNotes',
  'vimeoBeforeSubtitling',
  'movedToKapwingArchive',
  'vimeoReadyFolderUrl',
] as const

export const subtitlingFields = [
  'needsSubtitling',
  'vimeoBeforeSubtitling',
  'vimeoReadyFolderUrl',
] as const

async function resolveProductionForAccess(
  req: PayloadRequest,
  doc: VideoProject,
): Promise<Production | null> {
  let production = resolveProductionFromEpisode(doc)
  if (production) return production as Production
  const prodId = resolveRelId(doc.production)
  if (!prodId) return null
  try {
    return (await req.payload.findByID({
      collection: 'productions',
      id: prodId,
      depth: 0,
      overrideAccess: true,
    })) as Production
  } catch {
    return null
  }
}

export const fieldAccess =
  (fieldKey: string): FieldAccess =>
  async ({ req, doc, data }) => {
    const user = asAppUser(req.user)
    if (!user || !doc) return false
    if (user.role === 'admin' || user.role === 'project_manager') return true

    if (fieldKey === 'production' || fieldKey === 'category') return false

    const production = await resolveProductionForAccess(req, doc as VideoProject)
    const episode = { ...(doc as VideoProject), ...(data as Partial<VideoProject>) }
    return canEditField({ user, production, episode, fieldKey })
  }

/** @deprecated use fieldAccess(fieldKey) */
export const canUpdateProjectField: FieldAccess = fieldAccess('editingNotes')
