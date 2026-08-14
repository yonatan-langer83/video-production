import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { getProductionBySlug, isAdminOrPM } from '@/lib/productions'
import { slugifyProduction } from '@/lib/slug'

const SLUG_ERROR =
  'ה-slug חייב להכיל אותיות באנגלית או מספרים. רווחים הופכים למקף; עברית וסימנים אינם מותרים.'

function emptyToNull(val: unknown) {
  return val === '' || val == null ? null : val
}

function relValue(val: unknown) {
  const v = emptyToNull(val)
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : v
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await ctx.params
  const production = await getProductionBySlug(slug, user)
  if (!production) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(production)
}

export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdminOrPM(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug } = await ctx.params
  const production = await getProductionBySlug(slug, user, { includeArchived: true })
  if (!production) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = (await req.json()) as Record<string, unknown>
  const data: Record<string, unknown> = {}

  for (const key of ['name', 'slug', 'description', 'color', 'vimeoFolderUrl', 'spotifyUrl', 'youtubeUrl']) {
    if (key in body) {
      const val = body[key]
      if (key === 'name') {
        data[key] = typeof val === 'string' ? val.trim() : production.name
      } else if (key === 'slug') {
        const { slug: next } = slugifyProduction(typeof val === 'string' ? val : '')
        if (!next) {
          return NextResponse.json({ error: SLUG_ERROR }, { status: 400 })
        }
        data.slug = next
      } else {
        data[key] = emptyToNull(val)
      }
    }
  }

  for (const key of ['defaultProjectManager', 'defaultEditor', 'defaultSubtitler']) {
    if (key in body) data[key] = relValue(body[key])
  }
  if ('assignedUsers' in body) {
    const raw = body.assignedUsers
    data.assignedUsers = Array.isArray(raw)
      ? raw.map((id) => relValue(id)).filter((id) => id != null)
      : []
  }
  if ('status' in body) {
    data.status = body.status === 'completed' ? 'completed' : 'in_process'
  }
  if ('coverImage' in body) {
    data.coverImage = relValue(body.coverImage)
  }
  if ('archived' in body) {
    data.archived = Boolean(body.archived)
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields' }, { status: 400 })
  }

  const payload = await getPayloadClient()
  try {
    const updated = await payload.update({
      collection: 'productions',
      id: production.id,
      data,
      user,
      depth: 1,
    })
    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
