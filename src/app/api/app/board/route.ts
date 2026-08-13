import { NextResponse } from 'next/server'
import type { Where } from 'payload'

import { getCurrentUser } from '@/lib/auth'
import { resolveRelId } from '@/lib/fieldPermissions'
import { getPayloadClient } from '@/lib/payload'
import { queueStagesForRole } from '@/lib/pipeline'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const production = url.searchParams.get('production')
  const payload = await getPayloadClient()

  const where: Where = {}
  if (production) where.production = { equals: production }

  const stages = queueStagesForRole(user.role)
  const scoped =
    user.role === 'editor' || user.role === 'subtitler' || user.role === 'av_manager'
  if (scoped) {
    where.pipelineStage = { in: stages }
  }
  if (user.role === 'editor') {
    where.editor = { equals: user.id }
  }
  if (user.role === 'subtitler') {
    where.subtitler = { equals: user.id }
  }

  const { docs } = await payload.find({
    collection: 'video-projects',
    where,
    sort: '-episodeNumber',
    limit: 400,
    depth: 1,
    user,
  })

  const versionIds: Array<number | string> = []
  const versionsByEpisode = new Map<string, number | string>()
  const reviewVersions = await payload.find({
    collection: 'review-versions',
    where: { isCurrent: { equals: true } },
    limit: 400,
    depth: 0,
    overrideAccess: true,
  })
  for (const v of reviewVersions.docs) {
    const ep = resolveRelId(v.episode)
    if (ep) {
      versionsByEpisode.set(String(ep), v.id)
      versionIds.push(v.id)
    }
  }

  const openCounts = new Map<string, number>()
  if (versionIds.length) {
    const comments = await payload.find({
      collection: 'review-comments',
      where: {
        and: [{ reviewVersion: { in: versionIds } }, { resolved: { equals: false } }],
      },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })
    for (const c of comments.docs) {
      const vid = resolveRelId(c.reviewVersion)
      if (!vid) continue
      const ep = [...versionsByEpisode.entries()].find(([, id]) => String(id) === String(vid))?.[0]
      if (ep) openCounts.set(ep, (openCounts.get(ep) || 0) + 1)
    }
  }

  const events = docs.map((p) => {
    const prod = typeof p.production === 'object' && p.production ? p.production : null
    const setup = typeof p.shootSetup === 'object' && p.shootSetup ? p.shootSetup : null
    return {
      id: p.id,
      title: p.title,
      episodeNumber: p.episodeNumber,
      pipelineStage: p.pipelineStage || 'planned',
      filmedAt: p.filmedAt,
      publishedAt: p.publishedAt,
      shootToEditorNotes: p.shootToEditorNotes,
      production: prod
        ? { id: prod.id, name: prod.name, slug: prod.slug, color: prod.color }
        : null,
      setupName: setup?.name || null,
      editor: typeof p.editor === 'object' && p.editor ? p.editor.name : null,
      subtitler: typeof p.subtitler === 'object' && p.subtitler ? p.subtitler.name : null,
      openReviewComments: openCounts.get(String(p.id)) || 0,
    }
  })

  return NextResponse.json({ docs: events })
}
