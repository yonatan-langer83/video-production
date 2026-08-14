'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  Archive,
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

import { ArchiveButton } from '@/components/ArchiveButton'
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

function pageTitle(pathname: string, production?: ProductionHeader | null) {
  if (production) return production.name
  if (pathname.startsWith('/board')) return 'לוח עבודה'
  if (pathname.startsWith('/calendar')) return 'לוח שנה'
  if (pathname.startsWith('/notifications')) return 'התראות'
  if (pathname.startsWith('/archive')) return 'ארכיון'
  return 'הפקות וידאו'
}

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
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        תפריט
      </p>
      {navItems.map(({ href, label, sub, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground no-underline transition-colors hover:bg-accent hover:text-foreground hover:no-underline',
              active && 'bg-primary/10 font-medium text-primary hover:bg-primary/10 hover:text-primary',
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>
              {label}
              <span className="block text-xs font-normal text-muted-foreground">{sub}</span>
            </span>
          </Link>
        )
      })}
      {showAdmin ? (
        <>
          <p className="mb-2 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            ניהול
          </p>
          <Link
            href="/archive"
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground no-underline transition-colors hover:bg-accent hover:text-foreground hover:no-underline',
              pathname.startsWith('/archive') &&
                'bg-primary/10 font-medium text-primary hover:bg-primary/10 hover:text-primary',
            )}
          >
            <Archive className="h-5 w-5 shrink-0" />
            <span>
              ארכיון
              <span className="block text-xs font-normal text-muted-foreground">Archive</span>
            </span>
          </Link>
          <Link
            href="/admin"
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground no-underline transition-colors hover:bg-accent hover:text-foreground hover:no-underline',
              pathname.startsWith('/admin') &&
                'bg-primary/10 font-medium text-primary hover:bg-primary/10 hover:text-primary',
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span>
              ניהול
              <span className="block text-xs font-normal text-muted-foreground">Admin</span>
            </span>
          </Link>
        </>
      ) : null}
    </>
  )
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
        <Clapperboard className="h-5 w-5" />
      </span>
      <div>
        <p className="font-semibold leading-tight">הפקות וידאו</p>
        <p className="text-xs text-muted-foreground">Video Productions</p>
      </div>
    </div>
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
  const title = pageTitle(pathname, production)
  const initial = (userName || '?').trim().slice(0, 1).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-[280px] shrink-0 flex-col border-e bg-card lg:flex">
        <div className="px-5 py-6">
          <Link href="/" className="text-foreground no-underline hover:no-underline">
            <BrandMark />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
          <NavLinks pathname={pathname} showAdmin={showAdmin} />
        </nav>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="סגור תפריט"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between px-4 py-5">
              <BrandMark />
              <Button type="button" variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
              <NavLinks
                pathname={pathname}
                showAdmin={showAdmin}
                onNavigate={() => setMobileOpen(false)}
              />
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="תפריט"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                {production ? (
                  <p className="truncate text-xs text-muted-foreground">
                    <Link href="/" className="text-muted-foreground no-underline hover:text-primary">
                      הפקות וידאו
                    </Link>
                    <span> › {production.name}</span>
                  </p>
                ) : null}
                <h1 className="truncate text-base font-semibold md:text-lg">{title}</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <NotificationBell />
              <div className="hidden items-center gap-2 sm:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {initial}
                </span>
                {userName ? (
                  <span className="hidden max-w-[10rem] truncate text-sm text-muted-foreground xl:inline">
                    {userName}
                  </span>
                ) : null}
              </div>
              <LogoutButton />
            </div>
          </div>
          {production ? (
            <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2 md:px-6">
              {showAdmin ? (
                <>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/productions/${production.slug}/edit`}>ערוך</Link>
                  </Button>
                  <ArchiveButton
                    url={`/api/app/productions/${production.slug}`}
                    body={{ archived: true }}
                    label="ארכיון"
                    confirmText={`להעביר את "${production.name}" לארכיון? ההפקה וכל הפרקים שלה יוסתרו. ניתן לשחזר מארכיון.`}
                    redirectTo="/"
                    size="sm"
                  />
                </>
              ) : null}
              {production.vimeoFolderUrl ? (
                <a
                  href={production.vimeoFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs font-medium text-foreground no-underline hover:bg-accent hover:no-underline"
                >
                  Vimeo
                </a>
              ) : null}
              {production.spotifyUrl ? (
                <a
                  href={production.spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs font-medium text-foreground no-underline hover:bg-accent hover:no-underline"
                >
                  Spotify
                </a>
              ) : null}
              {production.youtubeUrl ? (
                <a
                  href={production.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs font-medium text-foreground no-underline hover:bg-accent hover:no-underline"
                >
                  YouTube
                </a>
              ) : null}
            </div>
          ) : null}
        </header>

        <main className="mx-auto w-full max-w-screen-2xl flex-1 p-4 md:p-6 2xl:p-10">{children}</main>
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
      variant="ghost"
      size="sm"
      className={cn('gap-2 text-muted-foreground', className)}
      onClick={() => void logout()}
      disabled={loading}
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">יציאה</span>
    </Button>
  )
}
