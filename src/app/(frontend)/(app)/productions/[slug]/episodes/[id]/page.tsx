import Link from 'next/link'
import { Calendar, Video } from 'lucide-react'
import { notFound } from 'next/navigation'

import { EpisodeFieldDisplay } from '@/components/EpisodeFieldDisplay'
import { StageBadge } from '@/components/StageBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/auth'
import { getFieldsByGroup } from '@/lib/episodeFields'
import { canEditAnyField } from '@/lib/fieldPermissions'
import { getProductionBySlug } from '@/lib/productions'
import { getPayloadClient } from '@/lib/payload'

function formatDate(value?: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('he-IL')
}

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const production = await getProductionBySlug(slug)
  if (!production) notFound()

  const user = await getCurrentUser()
  const payload = await getPayloadClient()
  let episode
  try {
    episode = await payload.findByID({ collection: 'video-projects', id, depth: 1 })
  } catch {
    notFound()
  }

  const epProductionId =
    typeof episode.production === 'object' && episode.production !== null
      ? episode.production.id
      : episode.production
  if (epProductionId !== production.id) notFound()

  const sections = getFieldsByGroup(production)
  const canEdit = user ? canEditAnyField({ user, production, episode }) : false
  const filmedDate = formatDate(episode.filmedAt)
  const publishedDate = formatDate(episode.publishedAt)

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`/productions/${slug}`}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← חזרה לפרקים
          </Link>
          <h2 className="mt-1 text-2xl font-semibold">{episode.title}</h2>
          {episode.episodeNumber ? (
            <p className="text-sm text-muted-foreground">פרק {episode.episodeNumber}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href={`/productions/${slug}/episodes/${id}/plan`}>תסריט AV</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/productions/${slug}/episodes/${id}/review`}>סקירה</Link>
          </Button>
          {canEdit ? (
            <Button asChild>
              <Link
                href={`/productions/${slug}/episodes/${id}/edit`}
                className="text-white no-underline hover:text-white hover:no-underline"
              >
                ערוך
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-4">
        <StageBadge stage={(episode as { pipelineStage?: string }).pipelineStage} />
      </div>

      {(episode as { shootToEditorNotes?: string | null }).shootToEditorNotes ? (
        <Card className="mb-4 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-base">הערות מהצילום / Notes from shoot</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">
            {(episode as { shootToEditorNotes?: string }).shootToEditorNotes}
          </CardContent>
        </Card>
      ) : null}

      {(filmedDate || publishedDate) && (
        <Card className="mb-4">
          <CardContent className="flex flex-wrap gap-3 pt-6">
            {filmedDate ? (
              <Badge variant="filmed" className="gap-1.5 px-3 py-1.5 text-sm">
                <Video className="h-3.5 w-3.5" />
                צילום / Recording: {filmedDate}
              </Badge>
            ) : null}
            {publishedDate ? (
              <Badge variant="published" className="gap-1.5 px-3 py-1.5 text-sm">
                <Calendar className="h-3.5 w-3.5" />
                פרסום / Publish: {publishedDate}
              </Badge>
            ) : null}
          </CardContent>
        </Card>
      )}

      {sections.map((section) => (
        <Card key={section.group} className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">{section.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => (
                <EpisodeFieldDisplay key={field.key} episode={episode} field={field} />
              ))}
            </dl>
          </CardContent>
        </Card>
      ))}
    </>
  )
}
