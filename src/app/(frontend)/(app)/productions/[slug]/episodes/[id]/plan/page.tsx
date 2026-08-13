'use client'

import Link from 'next/link'
import { MessageSquare, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { mediaUrl } from '@/lib/videoEmbed'

type Setup = { id: number | string; name: string }
type Comment = { author?: { name?: string } | number; body: string; createdAt?: string }
type Scene = {
  title?: string
  script?: string
  visual?: string
  duration?: string
  images?: unknown[]
  shootSetup?: { id?: number | string; name?: string } | number | string | null
  comments?: Comment[]
}
type Version = {
  id: number | string
  version: number
  label?: string | null
  isCurrent?: boolean
  scenes?: Scene[]
}

function nextRowLabel(scenes: Scene[]): string {
  const last = scenes[scenes.length - 1]?.title
  const match = last?.match(/^(\d+)\.(\d+)$/)
  if (match) return `${match[1]}.${Number(match[2]) + 1}`
  return `1.${scenes.length + 1}`
}

function setupId(value: Scene['shootSetup']): string {
  if (typeof value === 'object' && value) return String(value.id || '')
  return String(value || '')
}

function setupName(value: Scene['shootSetup']): string {
  if (typeof value === 'object' && value) return value.name || '—'
  return '—'
}

function authorName(author: Comment['author']): string {
  return typeof author === 'object' ? author?.name || 'משתמש' : 'משתמש'
}

export default function EpisodePlanPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const [slug, setSlug] = useState('')
  const [episodeId, setEpisodeId] = useState('')
  const [versions, setVersions] = useState<Version[]>([])
  const [currentId, setCurrentId] = useState('')
  const [scenes, setScenes] = useState<Scene[]>([])
  const [setups, setSetups] = useState<Setup[]>([])
  const [role, setRole] = useState('')
  const [selectedRow, setSelectedRow] = useState(0)
  const [commentDraft, setCommentDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const canEdit = role === 'admin' || role === 'project_manager' || role === 'av_manager'
  const selected = versions.find((v) => String(v.id) === currentId)
  const isCurrent = Boolean(selected?.isCurrent)
  const editable = canEdit && isCurrent
  const activeScene = scenes[selectedRow]

  const load = useCallback(async (id: string, keepVersionId?: string) => {
    const [scriptRes, setupRes, meRes] = await Promise.all([
      fetch(`/api/app/scripts/${id}`),
      fetch('/api/app/setups'),
      fetch('/api/app/me'),
    ])
    if (scriptRes.ok) {
      const data = (await scriptRes.json()) as { docs: Version[] }
      setVersions(data.docs)
      const current =
        (keepVersionId && data.docs.find((v) => String(v.id) === keepVersionId)) ||
        data.docs.find((v) => v.isCurrent) ||
        data.docs[0]
      if (current) {
        setCurrentId(String(current.id))
        setScenes(current.scenes || [])
      }
    }
    if (setupRes.ok) {
      const data = (await setupRes.json()) as { docs: Setup[] }
      setSetups(data.docs)
    }
    if (meRes.ok) {
      const me = (await meRes.json()) as { role?: string }
      setRole(me.role || '')
    }
  }, [])

  useEffect(() => {
    void params.then(({ slug: s, id }) => {
      setSlug(s)
      setEpisodeId(id)
      void load(id)
    })
  }, [params, load])

  function selectVersion(id: string) {
    const v = versions.find((x) => String(x.id) === id)
    setCurrentId(id)
    setScenes(v?.scenes || [])
    setSelectedRow(0)
    setCommentDraft('')
  }

  async function createVersion() {
    const res = await fetch(`/api/app/scripts/${episodeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromCurrent: versions.length > 0 }),
    })
    if (res.ok) void load(episodeId)
  }

  async function saveScenes(next: Scene[]) {
    if (!selected || !isCurrent || !canEdit) return
    setScenes(next)
    setSaving(true)
    await fetch(`/api/app/scripts/${episodeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        versionId: selected.id,
        scenes: next.map((s, i) => ({
          title: s.title || nextRowLabel(next.slice(0, i)),
          script: s.script || '',
          visual: s.visual || '',
          duration: s.duration || '',
          images: (s.images || []).map((img) =>
            typeof img === 'object' && img && 'id' in img
              ? (img as { id: number | string }).id
              : img,
          ),
          shootSetup: typeof s.shootSetup === 'object' && s.shootSetup ? s.shootSetup.id : s.shootSetup,
          sortOrder: i,
          comments: s.comments || [],
        })),
      }),
    })
    setSaving(false)
  }

  function patchScene(index: number, patch: Partial<Scene>) {
    setScenes((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  function commitScene(index: number, patch: Partial<Scene>) {
    const next = scenes.map((s, i) => (i === index ? { ...s, ...patch } : s))
    void saveScenes(next)
  }

  async function addComment() {
    const body = commentDraft.trim()
    if (!body || !selected || selectedRow < 0 || !scenes[selectedRow]) return
    await fetch(`/api/app/scripts/${episodeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId: selected.id, comment: { sceneIndex: selectedRow, body } }),
    })
    setCommentDraft('')
    void load(episodeId, String(selected.id))
  }

  async function uploadImage(index: number, file: File) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/app/media', { method: 'POST', body: form })
    if (!res.ok) return
    const media = (await res.json()) as { id: number | string; url?: string }
    const next = scenes.map((s, i) =>
      i === index ? { ...s, images: [...(s.images || []), media] } : s,
    )
    void saveScenes(next)
  }

  return (
    <>
      <Link
        href={`/productions/${slug}/episodes/${episodeId}`}
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← חזרה לפרק
      </Link>
      <div className="mb-4 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">תסריט AV</h2>
          <p className="text-sm text-muted-foreground">AV Script — שורות, אודיו, ויזואל, הערות</p>
        </div>
        {saving ? <p className="text-xs text-muted-foreground">שומר...</p> : null}
      </div>

      {versions.length === 0 ? (
        <div className="rounded-lg border bg-card p-6">
          <p className="mb-3 text-muted-foreground">אין תסריט עדיין. צור גרסה ראשונה.</p>
          {canEdit ? (
            <Button type="button" onClick={() => void createVersion()}>
              צור תסריט AV
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <aside className="w-full shrink-0 rounded-lg border bg-card lg:w-44">
            <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
              גרסאות / Versions
            </div>
            <ul className="max-h-64 space-y-0.5 overflow-auto p-2 lg:max-h-[70vh]">
              {versions.map((v) => {
                const active = String(v.id) === currentId
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => selectVersion(String(v.id))}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-start text-sm',
                        active
                          ? 'bg-primary text-white'
                          : 'hover:bg-accent',
                      )}
                    >
                      <span>v{v.version}</span>
                      {v.isCurrent ? (
                        <span className={cn('text-[10px]', active ? 'text-white/80' : 'text-muted-foreground')}>
                          נוכחי
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
            {canEdit ? (
              <div className="border-t p-2">
                <Button type="button" size="sm" className="w-full" onClick={() => void createVersion()}>
                  גרסה חדשה
                </Button>
              </div>
            ) : null}
          </aside>

          <div className="min-w-0 flex-1">
            <div className="overflow-hidden rounded-lg border bg-card" dir="ltr">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-left">Row</TableHead>
                    <TableHead className="min-w-[180px] text-left">Audio / Voiceover</TableHead>
                    <TableHead className="min-w-[180px] text-left">Visual</TableHead>
                    <TableHead className="w-28 text-left">Image</TableHead>
                    <TableHead className="w-20 text-left">Duration</TableHead>
                    <TableHead className="w-12 text-left" />
                    {editable ? <TableHead className="w-10 text-left" /> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenes.map((scene, index) => {
                    const count = scene.comments?.length || 0
                    const selected = index === selectedRow
                    return (
                      <TableRow
                        key={index}
                        data-state={selected ? 'selected' : undefined}
                        className={cn(selected && 'bg-primary/5')}
                        onClick={() => setSelectedRow(index)}
                      >
                        <TableCell className="align-top">
                          {editable ? (
                            <Input
                              dir="ltr"
                              className="h-8 px-2"
                              value={scene.title || ''}
                              onChange={(e) => patchScene(index, { title: e.target.value })}
                              onBlur={(e) => commitScene(index, { title: e.target.value })}
                            />
                          ) : (
                            <span className="text-sm font-medium">{scene.title || `${index + 1}`}</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          {editable ? (
                            <Textarea
                              dir="rtl"
                              className="min-h-[88px]"
                              value={scene.script || ''}
                              onChange={(e) => patchScene(index, { script: e.target.value })}
                              onBlur={(e) => commitScene(index, { script: e.target.value })}
                            />
                          ) : (
                            <p dir="rtl" className="whitespace-pre-wrap text-sm">
                              {scene.script || '—'}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          {editable ? (
                            <div className="space-y-2">
                              <Textarea
                                dir="rtl"
                                className="min-h-[64px]"
                                value={scene.visual || ''}
                                onChange={(e) => patchScene(index, { visual: e.target.value })}
                                onBlur={(e) => commitScene(index, { visual: e.target.value })}
                              />
                              <select
                                dir="rtl"
                                className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                                value={setupId(scene.shootSetup)}
                                onChange={(e) => {
                                  const next = scenes.map((s, i) =>
                                    i === index ? { ...s, shootSetup: e.target.value || null } : s,
                                  )
                                  void saveScenes(next)
                                }}
                              >
                                <option value="">סטאפ (ברירת מחדל)</option>
                                {setups.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div dir="rtl">
                              <p className="whitespace-pre-wrap text-sm">{scene.visual || '—'}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {setupName(scene.shootSetup)}
                              </p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-wrap gap-1">
                            {(scene.images || []).map((img, i) => {
                              const src = mediaUrl(img)
                              return src ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  key={i}
                                  src={src}
                                  alt=""
                                  className="h-14 w-14 rounded object-cover"
                                />
                              ) : null
                            })}
                            {editable ? (
                              <label className="flex h-14 w-14 cursor-pointer items-center justify-center rounded border text-[10px] text-muted-foreground">
                                +
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) void uploadImage(index, file)
                                  }}
                                />
                              </label>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          {editable ? (
                            <Input
                              dir="ltr"
                              className="h-8 px-2"
                              placeholder="00:12"
                              value={scene.duration || ''}
                              onChange={(e) => patchScene(index, { duration: e.target.value })}
                              onBlur={(e) => commitScene(index, { duration: e.target.value })}
                            />
                          ) : (
                            <span className="text-sm">{scene.duration || '—'}</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <button
                            type="button"
                            className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRow(index)
                            }}
                            aria-label="הערות"
                          >
                            <MessageSquare className="h-4 w-4" />
                            {count > 0 ? (
                              <span className="absolute -end-1 -top-1 rounded-full bg-primary px-1 text-[10px] leading-4 text-white">
                                {count}
                              </span>
                            ) : null}
                          </button>
                        </TableCell>
                        {editable ? (
                          <TableCell className="align-top">
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation()
                                const next = scenes.filter((_, i) => i !== index)
                                if (selectedRow >= next.length) setSelectedRow(Math.max(0, next.length - 1))
                                void saveScenes(next)
                              }}
                              aria-label="מחק שורה"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            {editable ? (
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                onClick={() =>
                  void saveScenes([
                    ...scenes,
                    {
                      title: nextRowLabel(scenes),
                      script: '',
                      visual: '',
                      duration: '',
                      comments: [],
                    },
                  ])
                }
              >
                + שורה
              </Button>
            ) : null}
          </div>

          <aside className="w-full shrink-0 rounded-lg border bg-card lg:w-72">
            <div className="border-b px-3 py-2">
              <p className="text-sm font-medium">הערות / Comments</p>
              <p className="text-xs text-muted-foreground">
                {activeScene ? `שורה ${activeScene.title || selectedRow + 1}` : 'בחרו שורה'}
              </p>
            </div>
            <div className="max-h-64 space-y-3 overflow-auto p-3 lg:max-h-[55vh]">
              {activeScene?.comments?.length ? (
                activeScene.comments.map((c, i) => (
                  <div key={i} className="rounded-md bg-muted/60 p-2 text-sm">
                    <p className="text-xs font-medium">{authorName(c.author)}</p>
                    <p className="whitespace-pre-wrap">{c.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">אין הערות לשורה זו.</p>
              )}
            </div>
            {activeScene ? (
              <div className="space-y-2 border-t p-3">
                <Textarea
                  rows={3}
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="הערה על השורה..."
                />
                <Button type="button" variant="secondary" className="w-full" onClick={() => void addComment()}>
                  שלח הערה
                </Button>
              </div>
            ) : null}
          </aside>
        </div>
      )}
    </>
  )
}
