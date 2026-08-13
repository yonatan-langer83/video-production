import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getProductionBySlug } from '@/lib/productions'

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await ctx.params
  const production = await getProductionBySlug(slug)
  if (!production) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(production)
}
