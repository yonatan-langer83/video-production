'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  Calendar,
  Clapperboard,
  Columns3,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  Bell,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NotificationBell } from './NotificationBell'

export type ProductionHeader = {
  name: string
  slug: string
  vimeoFolderUrl?: string | null
  spotifyUrl?: string | null
  youtubeUrl?: string | null
}

type Props = {
  userName?: string
  userRole?: 'admin' | 'project_manager' | 'editor' | 'subtitler' | 'av_manager'
  production?: ProductionHeader | null
  children: React.ReactNode
}

const navItems = [
  { href: '/', label: 'הפקות וידאו', sub: 'Productions', icon: LayoutGrid },
  { href: '/board', label: 'לוח עבודה', sub: 'Board', icon: Columns3 },
  { href: '/calendar', label: 'לוח שנה', sub: 'Calendar', icon: Calendar },
  { href: '/notifications', label: 'התראות', sub: 'Notifications', icon: Bell },
]

function NavLinks({
  pathname,
  showAdmin,
  onNavigate,
}: {
  pathname: string
  showAdmin: boolean
  onNavigate?: () => void
}) {
  return (
    <>
      {navItems.map(({ href, label, sub, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground no-underline transition-colors hover:bg-accent hover:no-underline',
              active && 'bg-primary/10 font-medium text-primary',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>
              {label}
              <span className="block text-xs font-normal text-muted-foreground">{sub}</span>
            </span>
          </Link>
        )
      })}
      {showAdmin ? (
        <Link
          href="/admin"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground no-underline transition-colors hover:bg-accent hover:no-underline',
            pathname.startsWith('/admin') && 'bg-primary/10 font-medium text-primary',
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>
            ניהול
            <span className="block text-xs font-normal text-muted-foreground">Admin</span>
          </span>
        </Link>
      ) : null}
    </>
  )
}

export function AppShell({ userName, userRole, production, children }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isLogin = pathname === '/login'

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (isLogin) return <>{children}</>

  const showAdmin = userRole === 'admin' || userRole === 'project_manager'

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-e bg-card md:flex md:flex-col">
        <div className="border-b p-5">
          <div className="flex items-center gap-2 text-primary">
            <Clapperboard className="h-5 w-5" />
            <div>
              <p className="font-semibold leading-tight">הפקות וידאו</p>
              <p className="text-xs text-muted-foreground">Video Productions</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          <NavLinks pathname={pathname} showAdmin={showAdmin} />
        </nav>

        <div className="space-y-2 border-t p-4">
          <div className="flex items-center justify-between">
            {userName ? <p className="truncate text-sm text-muted-foreground">{userName}</p> : null}
            <NotificationBell />
          </div>
          <LogoutButton className="w-full justify-start" />
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="סגור תפריט"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2 text-primary">
                <Clapperboard className="h-5 w-5" />
                <p className="font-semibold">הפקות וידאו</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              <NavLinks
                pathname={pathname}
                showAdmin={showAdmin}
                onNavigate={() => setMobileOpen(false)}
              />
            </nav>
            <div className="space-y-2 border-t p-4">
              {userName ? <p className="truncate text-sm text-muted-foreground">{userName}</p> : null}
              <LogoutButton className="w-full justify-start" />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {production ? (
          <header className="border-b bg-primary px-4 py-3 text-primary-foreground md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-white/80">
                  <Link href="/" className="text-white no-underline hover:underline">
                    הפקות וידאו
                  </Link>{' '}
                  › {production.name}
                </p>
                <h1 className="text-lg font-semibold text-white">{production.name}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                {production.vimeoFolderUrl ? (
                  <a
                    href={production.vimeoFolderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-white/15 px-3 py-1 text-xs text-white no-underline hover:bg-white/25 hover:no-underline"
                  >
                    Vimeo
                  </a>
                ) : null}
                {production.spotifyUrl ? (
                  <a
                    href={production.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-white/15 px-3 py-1 text-xs text-white no-underline hover:bg-white/25 hover:no-underline"
                  >
                    Spotify
                  </a>
                ) : null}
                {production.youtubeUrl ? (
                  <a
                    href={production.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-white/15 px-3 py-1 text-xs text-white no-underline hover:bg-white/25 hover:no-underline"
                  >
                    YouTube
                  </a>
                ) : null}
              </div>
            </div>
          </header>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-b px-4 py-2 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="תפריט"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <LogoutButton />
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

function LogoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)

  const logout = useCallback(async () => {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }, [])

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={cn('gap-2', className)}
      onClick={() => void logout()}
      disabled={loading}
    >
      <LogOut className="h-4 w-4" />
      יציאה
    </Button>
  )
}
