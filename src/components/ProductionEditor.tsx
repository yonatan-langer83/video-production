'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ProductionForm, type ProductionFormValues } from '@/components/ProductionForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ProductionEditor({
  mode,
  slug,
  initial,
}: {
  mode: 'create' | 'edit'
  slug?: string
  initial?: ProductionFormValues
}) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function onSubmit(body: Record<string, unknown>) {
    setSaving(true)
    setError('')
    const url = mode === 'create' ? '/api/app/productions' : `/api/app/productions/${slug}`
    const res = await fetch(url, {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) {
      setError(mode === 'create' ? 'יצירה נכשלה' : 'שמירה נכשלה')
      return
    }
    const doc = (await res.json()) as { slug: string }
    router.push(`/productions/${doc.slug}`)
    router.refresh()
  }

  return (
    <>
      <Link
        href={mode === 'edit' && slug ? `/productions/${slug}` : '/'}
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← חזרה
      </Link>
      <div className="mb-6 mt-2">
        <h2 className="text-2xl font-semibold">{mode === 'create' ? 'הפקה חדשה' : 'עריכת הפקה'}</h2>
        <p className="text-sm text-muted-foreground">
          {mode === 'create' ? 'New production' : 'Edit production'}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי ההפקה</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductionForm
            initial={initial}
            submitLabel={mode === 'create' ? 'צור הפקה' : 'שמור'}
            saving={saving}
            error={error}
            onSubmit={(body) => void onSubmit(body)}
          />
        </CardContent>
      </Card>
    </>
  )
}
