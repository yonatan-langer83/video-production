'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

import type { AppUser } from '@/access'
import { collectEpisodeFormBody, EpisodeFieldForm } from '@/components/EpisodeFieldForm'
import { Button } from '@/components/ui/button'
import type { FormFieldEntry } from '@/lib/episodeFields'
import { getEditableFormFields } from '@/lib/fieldPermissions'
import type { Production, VideoProject } from '@/payload-types'

type UserOption = { id: number | string; name: string }
type SetupOption = { id: number | string; name: string }

export default function EpisodeEditPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [episodeId, setEpisodeId] = useState('')
  const [episode, setEpisode] = useState<VideoProject | null>(null)
  const [production, setProduction] = useState<Production | null>(null)
  const [entries, setEntries] = useState<FormFieldEntry[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [setups, setSetups] = useState<SetupOption[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void params.then(async ({ slug: s, id }) => {
      setSlug(s)
      setEpisodeId(id)
      const [epRes, usersRes, prodRes, meRes, setupRes] = await Promise.all([
        fetch(`/api/app/projects/${id}`),
        fetch('/api/app/team'),
        fetch(`/api/app/productions/${s}`),
        fetch('/api/app/me'),
        fetch('/api/app/setups'),
      ])
      if (!epRes.ok) {
        setError('לא נמצא פרק')
        return
      }
      const ep = (await epRes.json()) as VideoProject
      setEpisode(ep)

      let prod: Production | null = null
      if (prodRes.ok) {
        prod = (await prodRes.json()) as Production
        setProduction(prod)
      }

      let me: AppUser | null = null
      if (meRes.ok) {
        me = (await meRes.json()) as AppUser
      }

      setEntries(getEditableFormFields(prod, me, ep))

      if (usersRes.ok) {
        const data = (await usersRes.json()) as { docs?: UserOption[] }
        setUsers(data.docs ?? [])
      }
      if (setupRes.ok) {
        const data = (await setupRes.json()) as { docs?: SetupOption[] }
        setSetups(data.docs ?? [])
      }
      setReady(true)
    })
  }, [params])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!episode) return
    setSaving(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const body = collectEpisodeFormBody(form)

    const res = await fetch(`/api/app/projects/${episodeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSaving(false)
    if (!res.ok) {
      setError(res.status === 403 ? 'אין הרשאה לערוך שדות אלה' : 'שמירה נכשלה')
      return
    }
    router.push(`/productions/${slug}/episodes/${episodeId}`)
    router.refresh()
  }

  if (!episode || !ready) {
    return <p className="text-muted-foreground">{error || 'טוען...'}</p>
  }

  const hasEditable = entries.some((e) => e.editable)

  return (
    <>
      <Link
        href={`/productions/${slug}/episodes/${episodeId}`}
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← חזרה
      </Link>
      <div className="mb-6 mt-2">
        <h2 className="text-2xl font-semibold">עריכת פרק</h2>
        <p className="text-sm text-muted-foreground">Edit episode</p>
      </div>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {!hasEditable ? (
        <p className="mb-4 text-muted-foreground">
          אין לך הרשאה לערוך שדות בפרק זה. / No editable fields for your role.
        </p>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <EpisodeFieldForm
          entries={entries}
          episode={episode}
          users={users}
          setups={setups}
          production={production}
        />
        <Button type="submit" disabled={saving || !hasEditable}>
          {saving ? 'שומר...' : 'שמור'}
        </Button>
      </form>
    </>
  )
}
