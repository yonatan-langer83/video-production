import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { BRAND_COLOR } from '@/lib/brand'
import { getEpisodeUrl } from '@/lib/episodeUrls'
import { getPayloadClient } from '@/lib/payload'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'video-projects',
    limit: 500,
    depth: 1,
    user,
  })

  const events: Array<{
    id: string
    title: string
    start: string
    backgroundColor: string
    url?: string
    extendedProps?: { url?: string; type: 'filmed' | 'published' }
  }> = []

  for (const p of docs) {
    const production =
      typeof p.production === 'object' && p.production !== null ? p.production : null
    const productionName = production?.name || 'הפקה'
    const productionColor = production?.color || BRAND_COLOR
    const episodeUrl = getEpisodeUrl(production, p.id)

    if (p.filmedAt) {
      events.push({
        id: `${p.id}-filmed`,
        title: `${productionName} — צילום: ${p.title}`,
        start: String(p.filmedAt).slice(0, 10),
        backgroundColor: '#ed6c02',
        ...(episodeUrl ? { url: episodeUrl, extendedProps: { url: episodeUrl, type: 'filmed' } } : {}),
      })
    }
    if (p.publishedAt) {
      events.push({
        id: `${p.id}-published`,
        title: `${productionName} — פרסום: ${p.title}`,
        start: String(p.publishedAt).slice(0, 10),
        backgroundColor: productionColor,
        ...(episodeUrl
          ? { url: episodeUrl, extendedProps: { url: episodeUrl, type: 'published' } }
          : {}),
      })
    }
  }

  return NextResponse.json({ events })
}
