import { NextResponse } from 'next/server'

import { AUTH_COOKIE } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as { email?: string; password?: string }
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  }

  const payload = await getPayloadClient()
  const result = await payload.login({
    collection: 'users',
    data: { email, password },
  })

  if (!result.token) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const res = NextResponse.json({ user: result.user })
  res.cookies.set(AUTH_COOKIE, result.token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
