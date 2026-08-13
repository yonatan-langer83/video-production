'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { extractVimeoId, formatTimecode, mediaUrl } from '@/lib/videoEmbed'

type Version = {
  id: number | string
  version: number
  label?: string | null
  isCurrent?: boolean
  videoUrl?: string | null
  videoFile?: { url?: string } | number | string | null
}

type Comment = {
  id: number | string
  body: string
  timeSeconds: number
  resolved?: boolean
  author?: { name?: string } | number
  reviewVersion: { id?: number | string } | number | string
}

export default function EpisodeReviewPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [slug, setSlug] = useState('')
  const [episodeId, setEpisodeId] = useState('')
  const [versions, setVersions] = useState<Version[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [currentId, setCurrentId] = useState('')
  const [role, setRole] = useState('')
  const [draft, setDraft] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [playhead, setPlayhead] = useState(0)

  const canCut = role === 'admin' || role === 'project_manager' || role === 'editor'
  const canModerate = role === 'admin' || role === 'project_manager'
  const selected = versions.find((v) => String(v.id) === currentId)
  const vimeoId = extractVimeoId(selected?.videoUrl)
  const fileUrl = mediaUrl(selected?.videoFile)

  const load = useCallback(async (id: string) => {
    const [revRes, meRes] = await Promise.all([
      fetch(`/api/app/review/${id}`),
      fetch('/api/app/me'),
    ])
    if (revRes.ok) {
      const data = (await revRes.json()) as { versions: Version[]; comments: Comment[] }
      setVersions(data.versions)
      setComments(data.comments)
      const current = data.versions.find((v) => v.isCurrent) || data.versions[0]
      if (current) setCurrentId(String(current.id))
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

  const visibleComments = comments
    .filter((c) => {
      const vid = typeof c.reviewVersion === 'object' ? c.reviewVersion?.id : c.reviewVersion
      return String(vid) === currentId
    })
    .sort((a, b) => Number(a.resolved) - Number(b.resolved) || a.timeSeconds - b.timeSeconds)

  function seek(seconds: number) {
    setPlayhead(seconds)
    if (videoRef.current) videoRef.current.currentTime = seconds
    if (vimeoId) {
      const src = `https://player.vimeo.com/video/${vimeoId}#t=${Math.floor(seconds)}s`
      if (iframeRef.current) iframeRef.current.src = src
    }
  }

  async function addComment() {
    if (!draft.trim() || !selected) return
    const time = videoRef.current?.currentTime ?? playhead
    await fetch(`/api/app/review/${episodeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'comment',
        comment: { versionId: selected.id, body: draft.trim(), timeSeconds: Math.floor(time) },
      }),
    })
    setDraft('')
    void load(episodeId)
  }

  async function resolve(id: number | string, resolved = true) {
    await fetch(`/api/app/review/${episodeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve', resolveId: id, resolved }),
    })
    void load(episodeId)
  }

  async function createCut() {
    await fetch(`/api/app/review/${episodeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl: newUrl || undefined, label: newLabel || undefined }),
    })
    setNewUrl('')
    setNewLabel('')
    void load(episodeId)
  }

  async function setStage(stage: 'editing' | 'published') {
    await fetch(`/api/app/review/${episodeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stage', stage }),
    })
    void load(episodeId)
  }

  return (
    <>
      <Link
        href={`/productions/${slug}/episodes/${episodeId}`}
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← חזרה לפרק
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">סקירה</h2>
          <p className="text-sm text-muted-foreground">Review — הערות על הקאט לפי זמן</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={currentId}
            onChange={(e) => setCurrentId(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                Cut v{v.version}
                {v.isCurrent ? ' (נוכחי)' : ''} {v.label || ''}
              </option>
            ))}
          </select>
          {canModerate ? (
            <>
              <Button type="button" variant="secondary" onClick={() => void setStage('editing')}>
                החזר לעריכה
              </Button>
              <Button type="button" onClick={() => void setStage('published')}>
                סמן כפורסם
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {vimeoId ? (
                <iframe
                  ref={iframeRef}
                  title="Vimeo"
                  src={`https://player.vimeo.com/video/${vimeoId}`}
                  className="aspect-video w-full rounded-md"
                  allow="autoplay; fullscreen"
                />
              ) : fileUrl ? (
                <video
                  ref={videoRef}
                  src={fileUrl}
                  controls
                  className="w-full rounded-md"
                  onTimeUpdate={(e) => setPlayhead(e.currentTarget.currentTime)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">אין וידאו בגרסה זו. הוסף קישור Vimeo.</p>
              )}
            </CardContent>
          </Card>

          {canCut ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">קאט חדש</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Input
                  placeholder="Vimeo URL"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
                <Input
                  placeholder="תווית (אופציונלי)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="max-w-xs"
                />
                <Button type="button" onClick={() => void createCut()}>
                  הוסף קאט
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">הערות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {visibleComments.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-md border p-2 text-sm ${c.resolved ? 'opacity-50' : ''}`}
                >
                  <button
                    type="button"
                    className="font-semibold text-primary"
                    onClick={() => seek(c.timeSeconds)}
                  >
                    {formatTimecode(c.timeSeconds)}
                  </button>
                  <p>
                    <span className="text-muted-foreground">
                      {typeof c.author === 'object' ? c.author?.name : ''}
                    </span>{' '}
                    {c.body}
                  </p>
                  {!c.resolved ? (
                    <Button type="button" size="sm" variant="secondary" onClick={() => void resolve(c.id)}>
                      סמן כטופל
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="הערה בזמן הנוכחי..."
            />
            <Button type="button" className="w-full" onClick={() => void addComment()}>
              הערה ב-{formatTimecode(playhead)}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
