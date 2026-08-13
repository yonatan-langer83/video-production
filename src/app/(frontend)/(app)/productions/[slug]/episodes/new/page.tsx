'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

import { collectEpisodeFormBody, EpisodeFieldForm } from '@/components/EpisodeFieldForm'
import { Button } from '@/components/ui/button'
import type { FormFieldEntry } from '@/lib/episodeFields'
import { getEditableFormFields } from '@/lib/fieldPermissions'
import type { Production } from '@/payload-types'

type UserOption = { id: number | string; name: string }
type SetupOption = { id: number | string; name: string }

function relId(field: unknown): number | string | null {
  if (!field) return null
  if (typeof field === 'object' && field !== null && 'id' in field)
    return (field as { id: number | string }).id
  if (typeof field === 'number' || typeof field === 'string') return field
  return null
}

export default function NewEpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [production, setProduction] = useState<Production | null>(null)
  const [entries, setEntries] = useState<FormFieldEntry[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [setups, setSetups] = useState<SetupOption[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void params.then(async ({ slug: s }) => {
      setSlug(s)
      const [prodRes, usersRes, setupRes] = await Promise.all([
        fetch(`/api/app/productions/${s}`),
        fetch('/api/app/team'),
        fetch('/api/app/setups'),
      ])
      if (prodRes.ok) {
        const prod = (await prodRes.json()) as Production
        setProduction(prod)
        setEntries(getEditableFormFields(prod))
      }
      if (usersRes.ok) {
        const data = (await usersRes.json()) as { docs?: UserOption[] }
        setUsers(data.docs ?? [])
      }
      if (setupRes.ok) {
        const data = (await setupRes.json()) as { docs?: SetupOption[] }
        setSetups(data.docs ?? [])
      }
    })
  }, [params])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!production) return
    setSaving(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const body = collectEpisodeFormBody(form)
    body.production = production.id

    const pm = relId(production.defaultProjectManager)
    const ed = relId(production.defaultEditor)
    const sub = relId(production.defaultSubtitler)
    if (pm && !body.projectManager) body.projectManager = pm
    if (ed && !body.editor) body.editor = ed
    if (sub && !body.subtitler) body.subtitler = sub

    const res = await fetch('/api/app/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSaving(false)
    if (!res.ok) {
      setError('יצירה נכשלה')
      return
    }
    const doc = (await res.json()) as { id: number | string }
    router.push(`/productions/${slug}/episodes/${doc.id}/edit`)
    router.refresh()
  }

  return (
    <>
      <Link href={`/productions/${slug}`} className="text-sm text-muted-foreground hover:text-primary">
        ← חזרה
      </Link>
      <div className="mb-6 mt-2">
        <h2 className="text-2xl font-semibold">פרק חדש</h2>
        <p className="text-sm text-muted-foreground">New episode</p>
      </div>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <EpisodeFieldForm
          entries={entries}
          users={users}
          setups={setups}
          production={production}
          titleRequired
        />
        <Button type="submit" disabled={saving || !production}>
          {saving ? 'יוצר...' : 'צור פרק'}
        </Button>
      </form>
    </>
  )
}
