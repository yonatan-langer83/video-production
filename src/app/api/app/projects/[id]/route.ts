import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { filterEditablePatch, resolveProductionFromEpisode } from '@/lib/fieldPermissions'
import { getPayloadClient } from '@/lib/payload'
import { canMoveStage, isPipelineStage } from '@/lib/pipeline'
import { getVisibleEpisode } from '@/lib/productions'
import type { Production, VideoProject } from '@/payload-types'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const episode = await getVisibleEpisode(id, user)
  if (!episode) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(episode)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const raw = (await req.json()) as Partial<VideoProject> & Record<string, unknown>
  const payload = await getPayloadClient()

  let episode: VideoProject
  try {
    episode = await payload.findByID({
      collection: 'video-projects',
      id,
      depth: 1,
      overrideAccess: true,
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let production: Production | null = resolveProductionFromEpisode(episode) as Production | null
  if (!production && episode.production) {
    const prodId =
      typeof episode.production === 'object' && episode.production !== null
        ? episode.production.id
        : episode.production
    if (prodId) {
      production = (await payload.findByID({
        collection: 'productions',
        id: prodId,
        depth: 0,
        overrideAccess: true,
      })) as Production
    }
  }

  const data: Partial<VideoProject> = { ...raw }
  delete (data as { id?: unknown }).id
  delete (data as { createdAt?: unknown }).createdAt
  delete (data as { updatedAt?: unknown }).updatedAt

  for (const key of ['projectManager', 'editor', 'subtitler', 'category', 'shootSetup']) {
    const val = raw[key]
    if (val === '' || val === null) (data as Record<string, unknown>)[key] = null
  }

  if (raw.pipelineStage != null) {
    const to = raw.pipelineStage
    const from = isPipelineStage(episode.pipelineStage) ? episode.pipelineStage : 'planned'
    if (!isPipelineStage(to) || !canMoveStage(user, from, to)) {
      return NextResponse.json({ error: 'Stage move not allowed' }, { status: 403 })
    }
  }
  if (raw.episodeNumber !== undefined && raw.episodeNumber !== null && String(raw.episodeNumber) !== '') {
    data.episodeNumber = Number(raw.episodeNumber)
  }

  const filtered = filterEditablePatch({
    user,
    production,
    episode,
    data: data as Record<string, unknown>,
  })

  if (Object.keys(filtered).length === 0) {
    return NextResponse.json({ error: 'No editable fields in request' }, { status: 403 })
  }

  const updated = await payload.update({
    collection: 'video-projects',
    id,
    data: filtered,
    user,
  })

  return NextResponse.json(updated)
}
