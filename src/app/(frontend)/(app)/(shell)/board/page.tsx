'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { StageBadge } from '@/components/StageBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PIPELINE_LABELS,
  allowedNextStages,
  boardStagesForRole,
  canMoveStage,
  isBackwardMove,
  isPipelineStage,
  type PipelineStage,
} from '@/lib/pipeline'

type BoardCard = {
  id: number | string
  title: string
  episodeNumber?: number | null
  pipelineStage: string
  filmedAt?: string | null
  production: { id: number | string; name: string; slug: string; color?: string | null } | null
  setupName?: string | null
  editor?: string | null
  openReviewComments: number
}

type Me = { id: number | string; role?: string }

export default function BoardPage() {
  const [docs, setDocs] = useState<BoardCard[]>([])
  const [productions, setProductions] = useState<Array<{ id: number | string; name: string }>>([])
  const [production, setProduction] = useState('')
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const qs = production ? `?production=${production}` : ''
    const [boardRes, prodRes, meRes] = await Promise.all([
      fetch(`/api/app/board${qs}`),
      fetch('/api/app/productions'),
      fetch('/api/app/me'),
    ])
    if (boardRes.ok) {
      const data = (await boardRes.json()) as { docs: BoardCard[] }
      setDocs(data.docs)
    }
    if (prodRes.ok) {
      const data = (await prodRes.json()) as { docs?: Array<{ id: number | string; name: string }> }
      setProductions(data.docs ?? [])
    }
    if (meRes.ok) setMe((await meRes.json()) as Me)
  }, [production])

  useEffect(() => {
    void load()
  }, [load])

  const columns = useMemo(() => {
    const stages = boardStagesForRole(me?.role)
    const map = new Map<PipelineStage, BoardCard[]>()
    for (const stage of stages) map.set(stage, [])
    for (const doc of docs) {
      const stage = isPipelineStage(doc.pipelineStage) ? doc.pipelineStage : 'planned'
      map.get(stage)?.push(doc)
    }
    return stages.map((stage) => ({ stage, items: map.get(stage) || [] }))
  }, [docs, me?.role])

  async function move(card: BoardCard, to: PipelineStage) {
    const from = isPipelineStage(card.pipelineStage) ? card.pipelineStage : 'planned'
    if (isBackwardMove(from, to) && !window.confirm('להחזיר לשלב קודם? / Move back a stage?')) return
    const res = await fetch(`/api/app/projects/${card.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipelineStage: to }),
    })
    if (!res.ok) {
      setError('לא ניתן להעביר לשלב זה')
      return
    }
    setError('')
    void load()
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">לוח עבודה</h2>
          <p className="text-sm text-muted-foreground">Board — שלב של כל פרק</p>
        </div>
        <select
          value={production}
          onChange={(e) => setProduction(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">כל ההפקות</option>
          {productions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <div
        className={
          columns.length >= 6
            ? 'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6'
            : columns.length >= 3
              ? 'grid grid-cols-1 gap-3 sm:grid-cols-3'
              : 'grid grid-cols-1 gap-3 sm:grid-cols-2'
        }
      >
        {columns.map(({ stage, items }) => (
          <div key={stage} className="min-w-0">
            <div className="mb-2">
              <StageBadge stage={stage} count={items.length} className="w-full justify-between" />
            </div>
            <div className="space-y-2">
              {items.map((card) => {
                const from = isPipelineStage(card.pipelineStage) ? card.pipelineStage : 'planned'
                const next = me
                  ? allowedNextStages(me as never, from).filter((s) =>
                      canMoveStage(me as never, from, s),
                    )
                  : []
                const href = card.production
                  ? `/productions/${card.production.slug}/episodes/${card.id}`
                  : '#'
                return (
                  <Card key={card.id}>
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-sm">
                        <Link href={href} className="text-foreground no-underline hover:text-primary">
                          {card.episodeNumber ? `#${card.episodeNumber} · ` : ''}
                          {card.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 p-3 pt-0 text-xs text-muted-foreground">
                      <p>{card.production?.name}</p>
                      {card.setupName ? <p>{card.setupName}</p> : null}
                      {card.openReviewComments > 0 ? (
                        <p className="text-primary">{card.openReviewComments} הערות פתוחות</p>
                      ) : null}
                      {next.length > 0 ? (
                        <select
                          className="h-8 w-full rounded-md border border-input bg-transparent px-2"
                          defaultValue=""
                          onChange={(e) => {
                            const to = e.target.value
                            e.target.value = ''
                            if (isPipelineStage(to)) void move(card, to)
                          }}
                        >
                          <option value="">העבר ל…</option>
                          {next.map((s) => (
                            <option key={s} value={s}>
                              {PIPELINE_LABELS[s].he}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
