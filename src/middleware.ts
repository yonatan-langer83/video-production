import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { slugifyProduction } from '@/lib/slug'

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/icon.png',
  '/apple-touch-icon.png',
  '/og.png',
  '/favicon.ico',
]
const FALLBACK_ORIGIN = 'https://videos.kabbalah.co.il'

function publicOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  if (!host || host.includes('localhost') || host.startsWith('127.0.0.1')) {
    return process.env.NEXT_PUBLIC_SERVER_URL || FALLBACK_ORIGIN
  }
  return `${proto}://${host}`
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/productions/')) {
    const rest = pathname.slice('/productions/'.length)
    const slash = rest.indexOf('/')
    const slugPart = slash === -1 ? rest : rest.slice(0, slash)
    const after = slash === -1 ? '' : rest.slice(slash)
    let decoded = slugPart
    try {
      decoded = decodeURIComponent(slugPart)
    } catch {
      /* keep */
    }
    const { slug: next } = slugifyProduction(decoded)
    if (next && next !== slugPart) {
      const url = req.nextUrl.clone()
      url.pathname = `/productions/${next}${after}`
      return NextResponse.redirect(url)
    }
  }

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/login')
  ) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next()
  }

  const token = req.cookies.get('payload-token')?.value
  if (!token && !pathname.startsWith('/admin')) {
    const loginUrl = new URL('/login', publicOrigin(req))
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|apple-touch-icon.png|og.png).*)'],
}
