import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import type { VideoProject } from '@/payload-types'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    title?: string
    status?: VideoProject['status']
    description?: string
    episodeNumber?: number
    production?: number | string
  }

  if (!body.production) {
    return NextResponse.json({ error: 'production is required' }, { status: 400 })
  }

  const productionId = Number(body.production)
  if (!Number.isFinite(productionId)) {
    return NextResponse.json({ error: 'production is required' }, { status: 400 })
  }

  const payload = await getPayloadClient()

  const created = await payload.create({
    collection: 'video-projects',
    data: {
      production: productionId,
      title: body.title || 'פרק חדש',
      status: body.status || 'in_progress',
      pipelineStage: 'planned',
      description: body.description,
      episodeNumber: body.episodeNumber,
    },
    user,
  })

  return NextResponse.json(created)
}
