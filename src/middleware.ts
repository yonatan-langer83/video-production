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
    (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/login'))
  ) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next()
  }

  const token = req.cookies.get('payload-token')?.value
  if (!token && !pathname.startsWith('/admin')) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|apple-touch-icon.png|og.png).*)'],
}
