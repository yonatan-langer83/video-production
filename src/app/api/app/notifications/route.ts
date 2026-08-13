import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const unread = url.searchParams.get('unread') === 'true'
  const limit = Number(url.searchParams.get('limit') || 20)

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'notifications',
    where: {
      recipient: { equals: user.id },
      ...(unread ? { read: { equals: false } } : {}),
    },
    sort: '-createdAt',
    limit,
    depth: 2,
    user,
  })

  return NextResponse.json(result)
}
