import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ArchiveButton } from '@/components/ArchiveButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { requireUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import {
  episodeListWhere,
  isAdminOrPM,
  productionListWhere,
  visibleProductionIds,
} from '@/lib/productions'
import { cn } from '@/lib/utils'

type Tab = 'productions' | 'episodes' | 'users'

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const user = await requireUser()
  if (!isAdminOrPM(user)) notFound()

  const { tab: rawTab } = await searchParams
  const isAdmin = user.role === 'admin'
  const tab: Tab =
    rawTab === 'episodes' ? 'episodes' : rawTab === 'users' && isAdmin ? 'users' : 'productions'

  const payload = await getPayloadClient()
  const liveIds = await visibleProductionIds(user)

  const { docs: productions } =
    tab === 'productions'
      ? await payload.find({
          collection: 'productions',
          where: productionListWhere(user, { archived: true }),
          sort: '-updatedAt',
          limit: 200,
          overrideAccess: true,
        })
      : { docs: [] }

  const { docs: episodes } =
    tab === 'episodes'
      ? await payload.find({
          collection: 'video-projects',
          where: episodeListWhere(liveIds, undefined, { archived: true }),
          sort: '-updatedAt',
          limit: 200,
          depth: 1,
          overrideAccess: true,
        })
      : { docs: [] }

  const { docs: users } =
    tab === 'users' && isAdmin
      ? await payload.find({
          collection: 'users',
          where: { archived: { equals: true } },
          sort: '-updatedAt',
          limit: 200,
          overrideAccess: true,
        })
      : { docs: [] }

  const tabs: Array<{ id: Tab; label: string; href: string }> = [
    { id: 'productions', label: 'הפקות', href: '/archive' },
    { id: 'episodes', label: 'פרקים', href: '/archive?tab=episodes' },
    ...(isAdmin ? [{ id: 'users' as const, label: 'משתמשים', href: '/archive?tab=users' }] : []),
  ]

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">ארכיון</h2>
        <p className="text-sm text-muted-foreground">Archive — שחזור הפקות, פרקים ומשתמשים</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t.id} asChild variant={tab === t.id ? 'default' : 'secondary'} size="sm">
            <Link
              href={t.href}
              className={cn(tab === t.id && 'text-white no-underline hover:text-white hover:no-underline')}
            >
              {t.label}
            </Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {tab === 'productions' ? (
            productions.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">אין הפקות בארכיון.</p>
            ) : (
              productions.map((prod) => (
                <div key={prod.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-medium">{prod.name}</p>
                    <p className="text-xs text-muted-foreground">{prod.slug}</p>
                  </div>
                  <ArchiveButton
                    url={`/api/app/productions/${prod.slug}`}
                    body={{ archived: false }}
                    label="שחזר"
                    confirmText={`לשחזר את "${prod.name}"?`}
                    size="sm"
                  />
                </div>
              ))
            )
          ) : null}

          {tab === 'episodes' ? (
            episodes.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">אין פרקים בארכיון.</p>
            ) : (
              episodes.map((ep) => {
                const prod = typeof ep.production === 'object' && ep.production ? ep.production : null
                return (
                  <div key={ep.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-medium">
                        {ep.episodeNumber ? `#${ep.episodeNumber} · ` : ''}
                        {ep.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{prod?.name}</p>
                    </div>
                    <ArchiveButton
                      url={`/api/app/projects/${ep.id}`}
                      body={{ archived: false }}
                      label="שחזר"
                      confirmText={`לשחזר את "${ep.title}"?`}
                      size="sm"
                    />
                  </div>
                )
              })
            )
          ) : null}

          {tab === 'users' ? (
            users.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">אין משתמשים בארכיון.</p>
            ) : (
              users.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-medium">{u.name || u.email}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <ArchiveButton
                    url={`/api/app/users/${u.id}`}
                    body={{ archived: false }}
                    label="שחזר"
                    confirmText={`לשחזר את ${u.name || u.email}?`}
                    size="sm"
                  />
                </div>
              ))
            )
          ) : null}
        </CardContent>
      </Card>
    </>
  )
}
