import { getPayloadClient } from '@/lib/payload'
import type { Production } from '@/payload-types'

export async function getProductionBySlug(slug: string): Promise<Production | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'productions',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  return result.docs[0] ?? null
}

export async function getProductionEpisodeCount(productionId: number | string): Promise<number> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'video-projects',
    where: { production: { equals: productionId } },
    limit: 0,
  })
  return result.totalDocs
}
