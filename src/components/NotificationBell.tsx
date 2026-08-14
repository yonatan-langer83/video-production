'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

export function NotificationBell() {
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    const res = await fetch('/api/app/notifications?unread=true&limit=1')
    if (!res.ok) return
    const data = (await res.json()) as { totalDocs: number }
    setCount(data.totalDocs)
  }, [])

  useEffect(() => {
    void load()
    const id = setInterval(() => void load(), 30000)
    return () => clearInterval(id)
  }, [load])

  return (
    <Link
      href="/notifications"
      title="התראות"
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground hover:no-underline',
      )}
    >
      <Bell className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -top-0.5 -start-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  )
}
