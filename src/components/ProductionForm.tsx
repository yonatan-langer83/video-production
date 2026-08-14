'use client'

import { FormEvent, useEffect, useState } from 'react'

import { CoverImageUpload } from '@/components/CoverImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BRAND_COLOR } from '@/lib/brand'
import { slugifyProduction } from '@/lib/slug'
import { mediaUrl } from '@/lib/videoEmbed'

type TeamUser = { id: number | string; name: string; role?: string }

export type ProductionFormValues = {
  name?: string
  slug?: string
  description?: string | null
  color?: string | null
  status?: 'in_process' | 'completed' | null
  coverImage?: number | string | { id?: number | string; url?: string | null } | null
  vimeoFolderUrl?: string | null
  spotifyUrl?: string | null
  youtubeUrl?: string | null
  defaultProjectManager?: number | string | { id?: number | string } | null
  defaultEditor?: number | string | { id?: number | string } | null
  defaultSubtitler?: number | string | { id?: number | string } | null
  assignedUsers?: Array<number | string | { id?: number | string }> | null
}

function relId(value: ProductionFormValues['defaultProjectManager']): string {
  if (!value) return ''
  if (typeof value === 'object') return String(value.id || '')
  return String(value)
}

function hexColor(value?: string | null): string {
  const v = (value || BRAND_COLOR).trim()
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : BRAND_COLOR
}

function assignedIds(value: ProductionFormValues['assignedUsers']): string[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => relId(v)).filter(Boolean)
}

export function ProductionForm({
  initial,
  submitLabel,
  onSubmit,
  error,
  saving,
}: {
  initial?: ProductionFormValues
  submitLabel: string
  saving: boolean
  error?: string
  onSubmit: (body: Record<string, unknown>) => void
}) {
  const [team, setTeam] = useState<TeamUser[]>([])
  const [teamReady, setTeamReady] = useState(false)
  const [selected, setSelected] = useState<string[]>(() => assignedIds(initial?.assignedUsers))
  const [slug, setSlug] = useState(() => slugifyProduction(initial?.slug || '', { keepTrailingHyphen: true }).slug)
  const [slugNote, setSlugNote] = useState('')
  const [color, setColor] = useState(() => hexColor(initial?.color))
  const [status, setStatus] = useState<'in_process' | 'completed'>(
    initial?.status === 'completed' ? 'completed' : 'in_process',
  )
  const [coverId, setCoverId] = useState(() => relId(initial?.coverImage))
  const [coverPreview, setCoverPreview] = useState(() => mediaUrl(initial?.coverImage))
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverError, setCoverError] = useState('')

  useEffect(() => {
    void fetch('/api/app/team')
      .then((r) => r.json())
      .then((data: { docs?: TeamUser[] }) => setTeam(data.docs || []))
      .finally(() => setTeamReady(true))
  }, [])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    onSubmit({
      name: form.get('name'),
      slug: slugifyProduction(slug).slug,
      description: form.get('description') || null,
      color,
      status,
      coverImage: coverId || null,
      vimeoFolderUrl: form.get('vimeoFolderUrl') || null,
      spotifyUrl: form.get('spotifyUrl') || null,
      youtubeUrl: form.get('youtubeUrl') || null,
      defaultProjectManager: form.get('defaultProjectManager') || null,
      defaultEditor: form.get('defaultEditor') || null,
      defaultSubtitler: form.get('defaultSubtitler') || null,
      assignedUsers: selected,
    })
  }

  const pms = team.filter((u) => u.role === 'admin' || u.role === 'project_manager')
  const editors = team.filter((u) => u.role === 'admin' || u.role === 'editor')
  const subs = team.filter((u) => u.role === 'admin' || u.role === 'subtitler')
  const pmOptions = pms.length ? pms : team
  const editorOptions = editors.length ? editors : team
  const subOptions = subs.length ? subs : team

  if (!teamReady) {
    return <p className="text-sm text-muted-foreground">טוען צוות...</p>
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-xl gap-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-2">
        <Label htmlFor="name">שם ההפקה *</Label>
        <Input id="name" name="name" required defaultValue={initial?.name || ''} placeholder="למשל: המקובלים" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          placeholder="mekubalim"
          autoComplete="off"
          dir="ltr"
          className="text-left"
          onChange={(e) => {
            const { slug: next, dropped } = slugifyProduction(e.target.value, { keepTrailingHyphen: true })
            setSlug(next)
            setSlugNote(
              dropped
                ? 'הוסרו תווים שאינם באנגלית (עברית, סימנים וכו׳). מותרות רק אותיות באנגלית, מספרים ומקף. רווחים הופכים למקף.'
                : '',
            )
          }}
        />
        <p className="text-xs text-muted-foreground">
          אותיות באנגלית, מספרים ומקף בלבד. רווחים הופכים אוטומטית למקף (-).
        </p>
        {slugNote ? <p className="text-xs text-amber-700">{slugNote}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">תיאור</Label>
        <Textarea id="description" name="description" defaultValue={initial?.description || ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">סטטוס</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value === 'completed' ? 'completed' : 'in_process')}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="in_process">בתהליך / In process</option>
          <option value="completed">הושלם / Completed</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">צבע</Label>
        <div className="flex items-center gap-3">
          <input
            id="color"
            type="color"
            value={hexColor(color)}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-md border border-input bg-transparent p-1"
          />
          <Input
            dir="ltr"
            className="max-w-[8rem] text-left font-mono"
            value={color}
            onChange={(e) => {
              const next = e.target.value.trim()
              setColor(next.startsWith('#') ? next : `#${next}`)
            }}
            onBlur={() => setColor(hexColor(color))}
          />
        </div>
      </div>
      <CoverImageUpload
        previewUrl={coverPreview}
        color={color}
        name={initial?.name}
        uploading={uploadingCover}
        onFile={(file) => {
          setCoverError('')
          setUploadingCover(true)
          const data = new FormData()
          data.append('file', file)
          void fetch('/api/app/media', { method: 'POST', body: data })
            .then(async (res) => {
              if (!res.ok) throw new Error('upload failed')
              const doc = (await res.json()) as { id: number | string; url?: string }
              setCoverId(String(doc.id))
              setCoverPreview(doc.url || URL.createObjectURL(file))
            })
            .catch(() => setCoverError('העלאת התמונה נכשלה'))
            .finally(() => setUploadingCover(false))
        }}
        onRemove={() => {
          setCoverId('')
          setCoverPreview(null)
          setCoverError('')
        }}
      />
      {coverError ? <p className="text-sm text-red-600">{coverError}</p> : null}
      <div className="space-y-2">
        <Label htmlFor="vimeoFolderUrl">General Vimeo Folder</Label>
        <Input id="vimeoFolderUrl" name="vimeoFolderUrl" defaultValue={initial?.vimeoFolderUrl || ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="spotifyUrl">Spotify Podcast</Label>
        <Input id="spotifyUrl" name="spotifyUrl" defaultValue={initial?.spotifyUrl || ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="youtubeUrl">YouTube Playlist</Label>
        <Input id="youtubeUrl" name="youtubeUrl" defaultValue={initial?.youtubeUrl || ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultProjectManager">מנהל פרויקט ברירת מחדל</Label>
        <select
          id="defaultProjectManager"
          name="defaultProjectManager"
          defaultValue={relId(initial?.defaultProjectManager)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">—</option>
          {pmOptions.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultEditor">עורך ברירת מחדל</Label>
        <select
          id="defaultEditor"
          name="defaultEditor"
          defaultValue={relId(initial?.defaultEditor)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">—</option>
          {editorOptions.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultSubtitler">מתמלל ברירת מחדל</Label>
        <select
          id="defaultSubtitler"
          name="defaultSubtitler"
          defaultValue={relId(initial?.defaultSubtitler)}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">—</option>
          {subOptions.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>משתמשים משויכים</Label>
        <p className="text-xs text-muted-foreground">
          עורכים, מתמללים ומנהלי AV שיראו את ההפקה. מנהלים רואים הכל.
        </p>
        <div className="max-h-48 space-y-1 overflow-auto rounded-md border p-2">
          {team.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(String(u.id))}
                onChange={(e) => {
                  setSelected((prev) =>
                    e.target.checked
                      ? [...prev, String(u.id)]
                      : prev.filter((id) => id !== String(u.id)),
                  )
                }}
              />
              {u.name}
            </label>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? 'שומר...' : submitLabel}
      </Button>
    </form>
  )
}
