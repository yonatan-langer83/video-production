'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type CalEvent = {
  id: string
  title: string
  start: string
  backgroundColor?: string
  url?: string
  extendedProps?: { url?: string; type?: 'filmed' | 'published' }
}

export default function CalendarPage() {
  const router = useRouter()
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/app/calendar')
    if (!res.ok) {
      setError('טעינת לוח השנה נכשלה')
      setLoading(false)
      return
    }
    const data = (await res.json()) as { events: CalEvent[] }
    setEvents(data.events)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">לוח שנה</h2>
        <p className="text-sm text-muted-foreground">Calendar — תאריכי צילום ופרסום לכל ההפקות</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="filmed">צילום / Recording</Badge>
        <Badge variant="published">פרסום / Publish</Badge>
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      {loading ? (
        <p className="text-muted-foreground">טוען...</p>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              locale="he"
              direction="rtl"
              height="auto"
              events={events}
              eventClick={(info) => {
                info.jsEvent.preventDefault()
                const url = info.event.extendedProps?.url || info.event.url || undefined
                if (url) {
                  router.push(url)
                } else {
                  setError('אין קישור לפרק זה')
                }
              }}
            />
          </CardContent>
        </Card>
      )}
    </>
  )
}
