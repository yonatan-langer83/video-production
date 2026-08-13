import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { canMoveStage } from '@/lib/pipeline'

function canCreateCut(role?: string) {
  return role === 'admin' || role === 'project_manager' || role === 'editor'
}

function canModerate(role?: string) {
  return role === 'admin' || role === 'project_manager'
}

export async function GET(_req: Request, { params }: { params: Promise<{ episodeId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { episodeId } = await params
  const payload = await getPayloadClient()
  const versions = await payload.find({
    collection: 'review-versions',
    where: { episode: { equals: episodeId } },
    sort: '-version',
    limit: 50,
    depth: 1,
    user,
  })

  const versionIds = versions.docs.map((d) => d.id)
  const comments =
    versionIds.length === 0
      ? { docs: [] }
      : await payload.find({
          collection: 'review-comments',
          where: { reviewVersion: { in: versionIds } },
          sort: 'timeSeconds',
          limit: 500,
          depth: 1,
          user,
        })

  return NextResponse.json({ versions: versions.docs, comments: comments.docs })
}

export async function POST(req: Request, { params }: { params: Promise<{ episodeId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { episodeId } = await params
  const body = (await req.json()) as {
    action?: string
    label?: string
    videoUrl?: string
    videoFile?: number | string
    comment?: { versionId: number | string; body: string; timeSeconds: number }
    resolveId?: number | string
    resolved?: boolean
    stage?: 'editing' | 'published'
  }

  const payload = await getPayloadClient()

  if (body.action === 'comment' && body.comment) {
    const created = await payload.create({
      collection: 'review-comments',
      data: {
        reviewVersion: Number(body.comment.versionId),
        author: Number(user.id),
        body: body.comment.body,
        timeSeconds: body.comment.timeSeconds || 0,
        resolved: false,
      },
      user,
      depth: 1,
    })
    return NextResponse.json(created)
  }

  if (body.action === 'resolve' && body.resolveId) {
    const existing = await payload.findByID({
      collection: 'review-comments',
      id: body.resolveId,
      depth: 1,
      overrideAccess: true,
    })
    const authorId =
      typeof existing.author === 'object' && existing.author ? existing.author.id : existing.author
    if (!canModerate(user.role) && String(authorId) !== String(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const updated = await payload.update({
      collection: 'review-comments',
      id: body.resolveId,
      data: { resolved: body.resolved !== false },
      user,
    })
    return NextResponse.json(updated)
  }

  if (body.action === 'stage' && body.stage) {
    if (!canModerate(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const episode = await payload.findByID({
      collection: 'video-projects',
      id: episodeId,
      overrideAccess: true,
    })
    const from = (episode.pipelineStage as 'review' | undefined) || 'review'
    if (!canMoveStage(user, from, body.stage)) {
      return NextResponse.json({ error: 'Stage move not allowed' }, { status: 403 })
    }
    const updated = await payload.update({
      collection: 'video-projects',
      id: episodeId,
      data: { pipelineStage: body.stage },
      user,
    })
    return NextResponse.json(updated)
  }

  if (!canCreateCut(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const existing = await payload.find({
    collection: 'review-versions',
    where: { episode: { equals: episodeId } },
    sort: '-version',
    limit: 50,
    overrideAccess: true,
  })

  const nextVersion = (existing.docs[0]?.version || 0) + 1
  for (const doc of existing.docs.filter((d) => d.isCurrent)) {
    await payload.update({
      collection: 'review-versions',
      id: doc.id,
      data: { isCurrent: false },
      overrideAccess: true,
    })
  }

  const created = await payload.create({
    collection: 'review-versions',
    data: {
      episode: Number(episodeId),
      version: nextVersion,
      label: body.label || `Cut v${nextVersion}`,
      isCurrent: true,
      videoUrl: body.videoUrl || null,
      videoFile: body.videoFile ? Number(body.videoFile) : null,
      createdBy: Number(user.id),
    },
    user,
    depth: 1,
  })

  return NextResponse.json(created)
}
