import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'productions',
    sort: 'sortOrder',
    limit: 50,
    user,
  })

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin' && user.role !== 'project_manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await req.json()) as {
    name?: string
    slug?: string
    description?: string | null
    color?: string
    vimeoFolderUrl?: string | null
    spotifyUrl?: string | null
    youtubeUrl?: string | null
    sortOrder?: number
  }

  if (!body.name?.trim() || !body.slug?.trim()) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
  }

  const payload = await getPayloadClient()
  const created = await payload.create({
    collection: 'productions',
    data: {
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description ?? undefined,
      color: body.color,
      vimeoFolderUrl: body.vimeoFolderUrl ?? undefined,
      spotifyUrl: body.spotifyUrl ?? undefined,
      youtubeUrl: body.youtubeUrl ?? undefined,
      sortOrder: body.sortOrder,
    },
    user,
  })

  return NextResponse.json(created)
}
