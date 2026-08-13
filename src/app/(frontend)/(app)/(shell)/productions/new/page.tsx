'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function NewProductionPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const body = {
      name: form.get('name'),
      slug: form.get('slug'),
      description: form.get('description') || null,
      vimeoFolderUrl: form.get('vimeoFolderUrl') || null,
      spotifyUrl: form.get('spotifyUrl') || null,
      youtubeUrl: form.get('youtubeUrl') || null,
    }

    const res = await fetch('/api/app/productions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSaving(false)
    if (!res.ok) {
      setError('יצירה נכשלה')
      return
    }
    const doc = (await res.json()) as { slug: string }
    router.push(`/productions/${doc.slug}`)
    router.refresh()
  }

  return (
    <>
      <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
        ← חזרה
      </Link>
      <div className="mb-6 mt-2">
        <h2 className="text-2xl font-semibold">הפקה חדשה</h2>
        <p className="text-sm text-muted-foreground">New production</p>
      </div>
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי ההפקה</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} className="grid max-w-lg gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם ההפקה *</Label>
              <Input id="name" name="name" required placeholder="למשל: המקובלים" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" name="slug" required placeholder="mekubalim" pattern="[a-z0-9-]+" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">תיאור</Label>
              <Textarea id="description" name="description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vimeoFolderUrl">General Vimeo Folder</Label>
              <Input id="vimeoFolderUrl" name="vimeoFolderUrl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spotifyUrl">Spotify Podcast</Label>
              <Input id="spotifyUrl" name="spotifyUrl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">YouTube Playlist</Label>
              <Input id="youtubeUrl" name="youtubeUrl" />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'יוצר...' : 'צור הפקה'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
