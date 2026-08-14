import type { Where } from 'payload'

import type { AppUser } from '@/access'
import { resolveRelId } from '@/lib/fieldPermissions'
import { getPayloadClient } from '@/lib/payload'
import type { Production, VideoProject } from '@/payload-types'

export function isAdminOrPM(user: AppUser | null | undefined): boolean {
  return user?.role === 'admin' || user?.role === 'project_manager'
}

export function isArchived(doc: { archived?: boolean | null } | null | undefined): boolean {
  return Boolean(doc?.archived)
}

function assignedMemberIds(production: Production): string[] {
  const ids: string[] = []
  for (const key of ['defaultProjectManager', 'defaultEditor', 'defaultSubtitler'] as const) {
    const id = resolveRelId(production[key])
    if (id != null) ids.push(String(id))
  }
  if (Array.isArray(production.assignedUsers)) {
    for (const member of production.assignedUsers) {
      const id = resolveRelId(member)
      if (id != null) ids.push(String(id))
    }
  }
  return ids
}

export function canSeeProduction(
  user: AppUser | null | undefined,
  production: Production,
  opts?: { includeArchived?: boolean },
): boolean {
  if (!user) return false
  if (isArchived(production) && !opts?.includeArchived) return false
  if (isAdminOrPM(user)) return true
  return assignedMemberIds(production).includes(String(user.id))
}

export function productionListWhere(
  user: AppUser,
  opts?: { archived?: boolean },
): Where {
  const archivedClause: Where =
    opts?.archived === true ? { archived: { equals: true } } : { archived: { not_equals: true } }

  if (isAdminOrPM(user)) return archivedClause

  return {
    and: [
      archivedClause,
      {
        or: [
          { assignedUsers: { in: [user.id] } },
          { defaultProjectManager: { equals: user.id } },
          { defaultEditor: { equals: user.id } },
          { defaultSubtitler: { equals: user.id } },
        ],
      },
    ],
  }
}

export async function visibleProductionIds(
  user: AppUser,
  opts?: { archived?: boolean },
): Promise<Array<number | string>> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'productions',
    where: productionListWhere(user, opts),
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })
  return docs.map((d) => d.id)
}

export function episodeListWhere(
  productionIds: Array<number | string>,
  extra?: Where,
  opts?: { archived?: boolean },
): Where {
  const archivedClause: Where =
    opts?.archived === true ? { archived: { equals: true } } : { archived: { not_equals: true } }
  const and: Where[] = [archivedClause]
  if (productionIds.length === 0) {
    and.push({ id: { equals: -1 } })
  } else {
    and.push({ production: { in: productionIds } })
  }
  if (extra) and.push(extra)
  return { and }
}

export async function getProductionBySlug(
  slug: string,
  user?: AppUser | null,
  opts?: { includeArchived?: boolean },
): Promise<Production | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'productions',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const production = result.docs[0] ?? null
  if (!production) return null
  if (isArchived(production) && !opts?.includeArchived) return null
  if (user && !canSeeProduction(user, production, opts)) return null
  return production
}

export async function visibleEpisodeWhere(user: AppUser, extra?: Where): Promise<Where> {
  const ids = await visibleProductionIds(user)
  return episodeListWhere(ids, extra)
}

export async function getVisibleEpisode(
  id: number | string,
  user: AppUser,
): Promise<VideoProject | null> {
  const payload = await getPayloadClient()
  try {
    const episode = await payload.findByID({
      collection: 'video-projects',
      id,
      depth: 1,
      overrideAccess: true,
    })
    if (isArchived(episode)) return null
    const production =
      typeof episode.production === 'object' && episode.production
        ? episode.production
        : null
    if (!production || !canSeeProduction(user, production)) return null
    return episode
  } catch {
    return null
  }
}

export async function getProductionEpisodeCount(productionId: number | string): Promise<number> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'video-projects',
    where: {
      and: [{ production: { equals: productionId } }, { archived: { not_equals: true } }],
    },
    limit: 0,
    overrideAccess: true,
  })
  return result.totalDocs
}
