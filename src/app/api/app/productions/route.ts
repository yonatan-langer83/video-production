import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { isAdminOrPM, productionListWhere } from '@/lib/productions'

function asOptionalString(val: unknown): string | undefined {
  return typeof val === 'string' && val.trim() ? val : undefined
}

function relId(val: unknown): number | undefined {
  if (val === '' || val == null) return undefined
  const n = Number(val)
  return Number.isFinite(n) ? n : undefined
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'productions',
    where: productionListWhere(user),
    sort: 'sortOrder',
    limit: 50,
    user,
  })

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdminOrPM(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await req.json()) as Record<string, unknown>

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
  }

  const assigned = Array.isArray(body.assignedUsers)
    ? body.assignedUsers.map((id) => relId(id)).filter((id): id is number => id != null)
    : undefined

  const payload = await getPayloadClient()
  const created = await payload.create({
    collection: 'productions',
    data: {
      name,
      slug,
      description: asOptionalString(body.description),
      color: typeof body.color === 'string' ? body.color : undefined,
      vimeoFolderUrl: asOptionalString(body.vimeoFolderUrl),
      spotifyUrl: asOptionalString(body.spotifyUrl),
      youtubeUrl: asOptionalString(body.youtubeUrl),
      defaultProjectManager: relId(body.defaultProjectManager),
      defaultEditor: relId(body.defaultEditor),
      defaultSubtitler: relId(body.defaultSubtitler),
      assignedUsers: assigned,
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
    },
    user,
  })

  return NextResponse.json(created)
}
