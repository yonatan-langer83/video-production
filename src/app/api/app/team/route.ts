import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'users',
    where: { archived: { not_equals: true } },
    limit: 100,
    user,
  })

  return NextResponse.json({
    docs: result.docs.map((u) => ({
      id: u.id,
      name: u.name || u.email,
      role: u.role,
    })),
  })
}
