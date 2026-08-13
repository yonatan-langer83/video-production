'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Notification = {
  id: number | string
  title: string
  message: string
  read?: boolean
  createdAt: string
  project?: {
    id: number | string
    title?: string
    production?: { slug?: string } | number | string | null
  } | number | string | null
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch('/api/app/notifications?limit=50')
    if (!res.ok) {
      setLoading(false)
      return
    }
    const data = (await res.json()) as { docs: Notification[] }
    setItems(data.docs)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function markRead(id: number | string) {
    await fetch(`/api/app/notifications/${id}`, { method: 'PATCH' })
    void load()
  }

  function episodeLink(n: Notification): string | null {
    const project = n.project
    if (!project || typeof project !== 'object') return null
    const id = project.id
    const prod = project.production
    const slug =
      typeof prod === 'object' && prod !== null && 'slug' in prod ? prod.slug : null
    if (slug && id) return `/productions/${slug}/episodes/${id}`
    return null
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">התראות</h2>
        <p className="text-sm text-muted-foreground">Notifications</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">טוען...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">אין התראות</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>כותרת</TableHead>
                  <TableHead>הודעה</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((n) => {
                  const link = episodeLink(n)
                  return (
                    <TableRow key={n.id} className={n.read ? 'opacity-60' : undefined}>
                      <TableCell className="font-medium">{n.title}</TableCell>
                      <TableCell className="max-w-md whitespace-pre-wrap">{n.message}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString('he-IL')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          {!n.read ? <Badge variant="secondary">חדש</Badge> : null}
                          {link ? (
                            <Link href={link} className="text-sm text-primary hover:underline">
                              פרק
                            </Link>
                          ) : null}
                          {!n.read ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => void markRead(n.id)}
                            >
                              סמן כנקרא
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
