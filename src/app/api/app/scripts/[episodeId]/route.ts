import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

function canEditPlan(role?: string) {
  return role === 'admin' || role === 'project_manager' || role === 'av_manager'
}

export async function GET(_req: Request, { params }: { params: Promise<{ episodeId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { episodeId } = await params
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'script-versions',
    where: { episode: { equals: episodeId } },
    sort: '-version',
    limit: 50,
    depth: 2,
    user,
  })
  return NextResponse.json({ docs })
}

export async function POST(req: Request, { params }: { params: Promise<{ episodeId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canEditPlan(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { episodeId } = await params
  const body = (await req.json()) as { label?: string; fromCurrent?: boolean }
  const payload = await getPayloadClient()

  const existing = await payload.find({
    collection: 'script-versions',
    where: { episode: { equals: episodeId } },
    sort: '-version',
    limit: 50,
    depth: 1,
    overrideAccess: true,
  })

  const nextVersion = (existing.docs[0]?.version || 0) + 1
  const current = existing.docs.find((d) => d.isCurrent) || existing.docs[0]
  const scenes =
    body.fromCurrent && current?.scenes
      ? current.scenes.map((s) => ({
          title: s.title,
          script: s.script,
          visual: s.visual,
          duration: s.duration,
          images: Array.isArray(s.images)
            ? s.images.map((img) => (typeof img === 'object' && img ? img.id : img))
            : [],
          shootSetup:
            typeof s.shootSetup === 'object' && s.shootSetup ? s.shootSetup.id : s.shootSetup,
          sortOrder: s.sortOrder,
          comments: [],
        }))
      : [{ title: '1.1', script: '', visual: '', duration: '', sortOrder: 0, comments: [] }]

  for (const doc of existing.docs.filter((d) => d.isCurrent)) {
    await payload.update({
      collection: 'script-versions',
      id: doc.id,
      data: { isCurrent: false },
      overrideAccess: true,
    })
  }

  const created = await payload.create({
    collection: 'script-versions',
    data: {
      episode: Number(episodeId),
      version: nextVersion,
      label: body.label || `v${nextVersion}`,
      isCurrent: true,
      createdBy: Number(user.id),
      scenes,
    },
    user,
    depth: 2,
  })

  return NextResponse.json(created)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ episodeId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { episodeId } = await params
  const body = (await req.json()) as {
    versionId?: number | string
    scenes?: unknown[]
    comment?: { sceneIndex: number; body: string }
  }

  const payload = await getPayloadClient()
  const versionId = body.versionId
  if (!versionId) return NextResponse.json({ error: 'versionId required' }, { status: 400 })

  const doc = await payload.findByID({
    collection: 'script-versions',
    id: versionId,
    depth: 1,
    overrideAccess: true,
  })

  const epId = typeof doc.episode === 'object' && doc.episode ? doc.episode.id : doc.episode
  if (String(epId) !== String(episodeId)) {
    return NextResponse.json({ error: 'Mismatch' }, { status: 400 })
  }

  if (body.comment) {
    const scenes = [...(doc.scenes || [])]
    const scene = scenes[body.comment.sceneIndex]
    if (!scene) return NextResponse.json({ error: 'Scene not found' }, { status: 404 })
    const comments = [
      ...(scene.comments || []),
      { author: Number(user.id), body: body.comment.body, createdAt: new Date().toISOString() },
    ]
    scenes[body.comment.sceneIndex] = { ...scene, comments }
    const updated = await payload.update({
      collection: 'script-versions',
      id: versionId,
      data: { scenes },
      user,
      depth: 2,
    })
    return NextResponse.json(updated)
  }

  if (!canEditPlan(user.role) || !doc.isCurrent) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await payload.update({
    collection: 'script-versions',
    id: versionId,
    data: { scenes: body.scenes as never },
    user,
    depth: 2,
  })
  return NextResponse.json(updated)
}
