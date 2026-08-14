import Link from 'next/link'
import type { Where } from 'payload'

import { ArchiveButton } from '@/components/ArchiveButton'
import { ProductionCoverArt } from '@/components/ProductionCoverArt'
import { StageBadge } from '@/components/StageBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { queueStagesForRole } from '@/lib/pipeline'
import { getProductionEpisodeCount, isAdminOrPM, productionListWhere, visibleEpisodeWhere } from '@/lib/productions'
import { getEpisodeUrl } from '@/lib/episodeUrls'
import { mediaUrl } from '@/lib/videoEmbed'

export default async function OverviewPage() {
  const user = await requireUser()
  const canManageProductions = isAdminOrPM(user)

  const payload = await getPayloadClient()
  const { docs: productions } = await payload.find({
    collection: 'productions',
    where: productionListWhere(user),
    sort: 'sortOrder',
    limit: 50,
    depth: 1,
    user,
  })

  const cards = await Promise.all(
    productions.map(async (prod) => ({
      ...prod,
      episodeCount: await getProductionEpisodeCount(prod.id),
    })),
  )
  const activeProductions = cards.filter((p) => p.status !== 'completed')
  const completedProductions = cards.filter((p) => p.status === 'completed')

  const extra: Where = {
    pipelineStage: { in: queueStagesForRole(user.role) },
  }
  if (user.role === 'editor') extra.editor = { equals: user.id }
  if (user.role === 'subtitler') extra.subtitler = { equals: user.id }

  const { docs: queue } = await payload.find({
    collection: 'video-projects',
    where: await visibleEpisodeWhere(user, extra),
    sort: user.role === 'av_manager' ? 'filmedAt' : '-updatedAt',
    limit: user.role === 'admin' || user.role === 'project_manager' ? 12 : 30,
    depth: 1,
    user,
  })

  const queueTitle =
    user.role === 'editor'
      ? 'ממתינים לעריכה'
      : user.role === 'subtitler'
        ? 'ממתינים לתמלול'
        : user.role === 'av_manager'
          ? 'צילומים קרובים'
          : 'פרקים לפי שלב'

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{queueTitle}</h2>
          <p className="text-sm text-muted-foreground">My queue</p>
        </div>
        <Button asChild>
          <Link href="/board" className="text-white no-underline hover:text-white hover:no-underline">
            לוח עבודה
          </Link>
        </Button>
      </div>

      <div className="mb-10 space-y-2">
        {queue.length === 0 ? (
          <p className="text-muted-foreground">אין פרקים בתור שלך כרגע.</p>
        ) : (
          queue.map((ep) => {
            const prod = typeof ep.production === 'object' && ep.production ? ep.production : null
            const href = getEpisodeUrl(prod, ep.id)
            const setup =
              typeof (ep as { shootSetup?: { name?: string } }).shootSetup === 'object'
                ? (ep as { shootSetup?: { name?: string } }).shootSetup?.name
                : null
            const notes = (ep as { shootToEditorNotes?: string | null }).shootToEditorNotes
            return (
              <Card key={ep.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <Link
                      href={href || '#'}
                      className="font-medium text-foreground no-underline hover:text-primary"
                    >
                      {ep.episodeNumber ? `#${ep.episodeNumber} · ` : ''}
                      {ep.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {prod?.name}
                      {setup ? ` · ${setup}` : ''}
                    </p>
                    {user.role === 'editor' && notes ? (
                      <p className="mt-1 text-sm text-orange-800">מהצילום: {notes}</p>
                    ) : null}
                    {user.role === 'av_manager' && !setup ? (
                      <p className="mt-1 text-sm text-orange-800">חסר סטאפ</p>
                    ) : null}
                  </div>
                  <StageBadge stage={(ep as { pipelineStage?: string }).pipelineStage} />
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">הפקות וידאו</h2>
          <p className="text-sm text-muted-foreground">Productions — בחר הפקה לניהול פרקים</p>
        </div>
        {canManageProductions ? (
          <Button asChild>
            <Link href="/productions/new" className="text-white no-underline hover:text-white hover:no-underline">
              + הוסף הפקה
            </Link>
          </Button>
        ) : null}
      </div>

      {activeProductions.length === 0 && completedProductions.length === 0 ? (
        <p className="text-muted-foreground">
          אין הפקות עדיין.{' '}
          {canManageProductions ? (
            <Link href="/productions/new" className="text-primary hover:underline">
              הוסף הפקה ראשונה
            </Link>
          ) : (
            'פנה למנהל המערכת.'
          )}
        </p>
      ) : activeProductions.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {activeProductions.map((prod) => (
            <ProductionOverviewCard
              key={prod.id}
              prod={prod}
              canManage={canManageProductions}
            />
          ))}
        </div>
      ) : null}

      {completedProductions.length > 0 ? (
        <>
          <div className="mb-6 mt-10">
            <h2 className="text-2xl font-semibold tracking-tight">הושלמו</h2>
            <p className="text-sm text-muted-foreground">Completed productions</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {completedProductions.map((prod) => (
              <ProductionOverviewCard
                key={prod.id}
                prod={prod}
                canManage={canManageProductions}
              />
            ))}
          </div>
        </>
      ) : null}
    </>
  )
}

function ProductionOverviewCard({
  prod,
  canManage,
}: {
  prod: {
    id: number | string
    name: string
    slug: string
    description?: string | null
    color?: string | null
    status?: string | null
    coverImage?: unknown
    episodeCount: number
  }
  canManage: boolean
}) {
  const cover = mediaUrl(prod.coverImage)
  return (
    <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/productions/${prod.slug}`} className="block no-underline">
        <ProductionCoverArt src={cover} color={prod.color} name={prod.name} />
      </Link>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          <Link
            href={`/productions/${prod.slug}`}
            className="text-foreground no-underline hover:text-primary hover:no-underline"
          >
            {prod.name}
          </Link>
        </CardTitle>
        {prod.description ? (
          <CardDescription>{prod.description.slice(0, 120)}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{prod.episodeCount} פרקים</Badge>
          <Badge variant={prod.status === 'completed' ? 'published' : 'secondary'}>
            {prod.status === 'completed' ? 'הושלם' : 'בתהליך'}
          </Badge>
        </div>
        {canManage ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/productions/${prod.slug}/edit`}>ערוך</Link>
            </Button>
            <ArchiveButton
              url={`/api/app/productions/${prod.slug}`}
              body={{ archived: true }}
              confirmText={`להעביר את "${prod.name}" לארכיון? ההפקה וכל הפרקים שלה יוסתרו.`}
              size="sm"
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
