import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

const DEFAULT_SETUP = {
  name: 'סטודיו תל אביב — כיסאות גבוהים, שני אנשים',
  description:
    'Tel Aviv Studio — High Chairs, two people.\nשני כיסאות גבוהים, מארח ואורח, שתי מצלמות.',
  sortOrder: 1,
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await getPayloadClient()
  let result = await payload.find({
    collection: 'shoot-setups',
    sort: 'sortOrder',
    limit: 100,
    depth: 1,
    user,
  })

  if (result.totalDocs === 0 && (user.role === 'admin' || user.role === 'project_manager')) {
    await payload.create({
      collection: 'shoot-setups',
      data: DEFAULT_SETUP,
      user,
    })
    result = await payload.find({
      collection: 'shoot-setups',
      sort: 'sortOrder',
      limit: 100,
      depth: 1,
      user,
    })
  }

  return NextResponse.json({ docs: result.docs })
}

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'project_manager', 'av_manager'].includes(user.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await req.json()) as { name?: string; description?: string }
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const payload = await getPayloadClient()
  const doc = await payload.create({
    collection: 'shoot-setups',
    data: { name: body.name.trim(), description: body.description || null },
    user,
  })
  return NextResponse.json(doc)
}
