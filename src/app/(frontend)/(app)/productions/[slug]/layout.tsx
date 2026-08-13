import { AppShell, type ProductionHeader } from '@/components/AppShell'
import { requireUser } from '@/lib/auth'
import { getProductionBySlug } from '@/lib/productions'
import { getPayloadClient } from '@/lib/payload'
import { notFound } from 'next/navigation'

export default async function ProductionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const user = await requireUser()
  const { slug } = await params
  const production = await getProductionBySlug(slug)
  if (!production) notFound()

  const payload = await getPayloadClient()
  const fullUser = await payload.findByID({ collection: 'users', id: user.id })

  const productionHeader: ProductionHeader = {
    name: production.name,
    slug: production.slug,
    vimeoFolderUrl: production.vimeoFolderUrl,
    spotifyUrl: production.spotifyUrl,
    youtubeUrl: production.youtubeUrl,
  }

  return (
    <AppShell userName={fullUser.name || fullUser.email} userRole={fullUser.role} production={productionHeader}>
      {children}
    </AppShell>
  )
}
