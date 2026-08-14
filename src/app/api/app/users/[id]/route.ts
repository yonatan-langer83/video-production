import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await ctx.params
  const body = (await req.json()) as { archived?: boolean }
  if (!('archived' in body)) {
    return NextResponse.json({ error: 'archived is required' }, { status: 400 })
  }
  if (body.archived && String(id) === String(user.id)) {
    return NextResponse.json({ error: 'Cannot archive yourself' }, { status: 400 })
  }

  const payload = await getPayloadClient()
  try {
    const updated = await payload.update({
      collection: 'users',
      id,
      data: { archived: Boolean(body.archived) },
      user,
    })
    return NextResponse.json({ id: updated.id, archived: updated.archived })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
