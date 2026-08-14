import Link from 'next/link'
import type { Where } from 'payload'
import { notFound } from 'next/navigation'

import { ArchiveButton } from '@/components/ArchiveButton'
import { EpisodeLinksCell } from '@/components/EpisodeFieldDisplay'
import { StageBadge } from '@/components/StageBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getListColumns, type EpisodeFieldDef } from '@/lib/episodeFields'
import { getCurrentUser } from '@/lib/auth'
import { canCreateEpisode } from '@/lib/fieldPermissions'
import { STATUS_LABELS } from '@/lib/labels'
import { getProductionBySlug } from '@/lib/productions'
import { getPayloadClient } from '@/lib/payload'
import type { VideoProject } from '@/payload-types'

type SearchParams = Promise<{ q?: string; status?: string }>

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('he-IL')
}

function ListCell({ field, episode }: { field: EpisodeFieldDef; episode: VideoProject }) {
  if (field.key === 'title') {
    return <>{episode.title}</>
  }
  if (field.key === 'episodeNumber') {
    return <>{episode.episodeNumber ?? '—'}</>
  }
  if (field.key === '_links') {
    return <EpisodeLinksCell episode={episode} />
  }
  if (field.key === 'status') {
    const status = (episode.status || 'in_progress') as 'future' | 'in_progress' | 'completed'
    return <Badge variant={status}>{STATUS_LABELS[status]}</Badge>
  }
  if (field.key === 'pipelineStage') {
    return <StageBadge stage={(episode as { pipelineStage?: string }).pipelineStage} />
  }
  if (field.key === 'filmedAt') {
    return <span className="text-sm">{formatDate(episode.filmedAt)}</span>
  }
  if (field.key === 'publishedAt') {
    return <span className="text-sm">{formatDate(episode.publishedAt)}</span>
  }
  if (field.key === 'duration') {
    return <>{episode.duration || '—'}</>
  }
  const val = episode[field.key as keyof VideoProject]
  if (val === null || val === undefined || val === '') return <>—</>
  return <>{String(val)}</>
}

export default async function ProductionEpisodesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  const { slug } = await params
  const { q, status } = await searchParams
  const user = await getCurrentUser()
  if (!user) notFound()
  const production = await getProductionBySlug(slug, user)
  if (!production) notFound()

  const canCreate = canCreateEpisode(user)
  const canManage = user.role === 'admin' || user.role === 'project_manager'

  const columns = getListColumns(production)

  const payload = await getPayloadClient()
  const clauses: Where[] = [
    { production: { equals: production.id } },
    { archived: { not_equals: true } },
  ]
  if (status && status !== 'all') {
    clauses.push({ status: { equals: status } })
  }
  if (q?.trim()) {
    clauses.push({ title: { contains: q.trim() } })
  }
  const where: Where = { and: clauses }

  const { docs } = await payload.find({
    collection: 'video-projects',
    sort: '-episodeNumber',
    limit: 200,
    where,
    user,
  })

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">פרקים</h2>
          <p className="text-sm text-muted-foreground">Episodes</p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link
                href={`/productions/${slug}/edit`}
                className="text-white no-underline hover:text-white hover:no-underline"
              >
                ערוך הפקה
              </Link>
            </Button>
            <ArchiveButton
              url={`/api/app/productions/${slug}`}
              body={{ archived: true }}
              confirmText={`להעביר את "${production.name}" לארכיון? ההפקה וכל הפרקים שלה יוסתרו. ניתן לשחזר מארכיון.`}
              redirectTo="/"
            />
            {canCreate ? (
              <Button asChild variant="secondary">
                <Link href={`/productions/${slug}/episodes/new`}>+ הוסף פרק</Link>
              </Button>
            ) : null}
          </div>
        ) : canCreate ? (
          <Button asChild>
            <Link href={`/productions/${slug}/episodes/new`}>+ הוסף פרק</Link>
          </Button>
        ) : null}
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-3" method="get">
            <Input
              type="search"
              name="q"
              placeholder="חיפוש לפי שם..."
              defaultValue={q || ''}
              className="max-w-xs"
            />
            <select
              name="status"
              defaultValue={status || 'all'}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="future">עתידי</option>
              <option value="in_progress">בתהליך</option>
              <option value="completed">הסתיים</option>
            </select>
            <Button type="submit" variant="secondary">
              סנן
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key}>
                    {col.label}
                    {col.labelEn ? (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {col.labelEn}
                      </span>
                    ) : null}
                  </TableHead>
                ))}
                {canManage ? <TableHead className="w-28">פעולות</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (canManage ? 1 : 0)} className="text-muted-foreground">
                    אין פרקים.
                    {canCreate ? (
                      <>
                        {' '}
                        <Link href={`/productions/${slug}/episodes/new`} className="text-primary">
                          הוסף פרק
                        </Link>
                      </>
                    ) : null}
                  </TableCell>
                </TableRow>
              ) : (
                docs.map((p) => (
                  <TableRow key={p.id}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.key === 'title' ? (
                          <Link
                            href={`/productions/${slug}/episodes/${p.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            <ListCell field={col} episode={p} />
                          </Link>
                        ) : (
                          <ListCell field={col} episode={p} />
                        )}
                      </TableCell>
                    ))}
                    {canManage ? (
                      <TableCell>
                        <ArchiveButton
                          url={`/api/app/projects/${p.id}`}
                          body={{ archived: true }}
                          confirmText={`להעביר את "${p.title}" לארכיון? ניתן לשחזר מארכיון.`}
                          size="sm"
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
