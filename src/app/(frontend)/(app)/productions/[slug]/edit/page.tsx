import { notFound } from 'next/navigation'

import { ProductionEditor } from '@/components/ProductionEditor'
import { requireUser } from '@/lib/auth'
import { getProductionBySlug, isAdminOrPM } from '@/lib/productions'

function relId(value: unknown): string | number | null {
  if (!value) return null
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return (value as { id: number | string }).id
  }
  if (typeof value === 'number' || typeof value === 'string') return value
  return null
}

export default async function EditProductionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const user = await requireUser()
  if (!isAdminOrPM(user)) notFound()

  const { slug } = await params
  const production = await getProductionBySlug(slug, user)
  if (!production) notFound()

  return (
    <ProductionEditor
      mode="edit"
      slug={production.slug}
      initial={{
        name: production.name,
        slug: production.slug,
        description: production.description,
        color: production.color,
        vimeoFolderUrl: production.vimeoFolderUrl,
        spotifyUrl: production.spotifyUrl,
        youtubeUrl: production.youtubeUrl,
        defaultProjectManager: relId(production.defaultProjectManager),
        defaultEditor: relId(production.defaultEditor),
        defaultSubtitler: relId(production.defaultSubtitler),
        assignedUsers: Array.isArray(production.assignedUsers)
          ? production.assignedUsers.map(relId).filter((id): id is string | number => id != null)
          : [],
      }}
    />
  )
}
