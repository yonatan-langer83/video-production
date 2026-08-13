import Link from 'next/link'
import type { Where } from 'payload'

import { StageBadge } from '@/components/StageBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUser } from '@/lib/auth'
import { BRAND_COLOR } from '@/lib/brand'
import { getPayloadClient } from '@/lib/payload'
import { queueStagesForRole } from '@/lib/pipeline'
import { getProductionEpisodeCount } from '@/lib/productions'
import { getEpisodeUrl } from '@/lib/episodeUrls'

export default async function OverviewPage() {
  const user = await requireUser()
  const canManageProductions = user.role === 'admin' || user.role === 'project_manager'

  const payload = await getPayloadClient()
  const { docs: productions } = await payload.find({
    collection: 'productions',
    sort: 'sortOrder',
    limit: 50,
  })

  const cards = await Promise.all(
    productions.map(async (prod) => ({
      ...prod,
      episodeCount: await getProductionEpisodeCount(prod.id),
    })),
  )

  const stages = queueStagesForRole(user.role)
  const where: Where = {}
  if (user.role === 'editor' || user.role === 'subtitler' || user.role === 'av_manager') {
    where.pipelineStage = { in: stages }
  }
  if (user.role === 'editor') where.editor = { equals: user.id }
  if (user.role === 'subtitler') where.subtitler = { equals: user.id }

  const { docs: queue } = await payload.find({
    collection: 'video-projects',
    where,
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.length === 0 ? (
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
        ) : (
          cards.map((prod) => (
            <Link
              key={prod.id}
              href={`/productions/${prod.slug}`}
              className="group no-underline hover:no-underline"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <div
                  className="h-1 rounded-t-xl"
                  style={{ background: prod.color || BRAND_COLOR }}
                />
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-foreground group-hover:text-primary">
                    {prod.name}
                  </CardTitle>
                  {prod.description ? (
                    <CardDescription>{prod.description.slice(0, 120)}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">{prod.episodeCount} פרקים</Badge>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </>
  )
}
