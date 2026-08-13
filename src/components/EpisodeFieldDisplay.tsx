import type { EpisodeFieldDef } from '@/lib/episodeFields'
import { formatEpisodeFieldDisplay, getEpisodeFieldValue } from '@/lib/episodeFields'
import type { VideoProject } from '@/payload-types'

function Field({ label, labelEn, value }: { label: string; labelEn?: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-muted-foreground">
        {label}
        {labelEn ? <span className="font-normal"> / {labelEn}</span> : null}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

function UrlField({
  label,
  labelEn,
  value,
}: {
  label: string
  labelEn?: string
  value?: string | null
}) {
  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-muted-foreground">
        {label}
        {labelEn ? <span className="font-normal"> / {labelEn}</span> : null}
      </dt>
      <dd className="text-sm">
        {value ? (
          <a href={value} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {value}
          </a>
        ) : (
          '—'
        )}
      </dd>
    </div>
  )
}

export function EpisodeFieldDisplay({
  episode,
  field,
}: {
  episode: VideoProject
  field: EpisodeFieldDef
}) {
  const value = getEpisodeFieldValue(episode, field.key)

  if (field.fieldType === 'url') {
    return (
      <UrlField
        label={field.label}
        labelEn={field.labelEn}
        value={typeof value === 'string' ? value : null}
      />
    )
  }

  return (
    <Field
      label={field.label}
      labelEn={field.labelEn}
      value={formatEpisodeFieldDisplay(episode, field)}
    />
  )
}

export function EpisodeLinksCell({ episode }: { episode: VideoProject }) {
  const links = [
    { href: episode.vimeoUrl, label: 'Vimeo' },
    { href: episode.spotifyUrl, label: 'Spotify' },
    { href: episode.youtubeUrl, label: 'YouTube' },
  ].filter((l) => l.href)

  if (links.length === 0) return <span className="text-muted-foreground">—</span>

  return (
    <span className="flex flex-wrap gap-2">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href!}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary hover:underline"
        >
          {l.label}
        </a>
      ))}
    </span>
  )
}
