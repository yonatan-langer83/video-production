import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { AppUser } from '@/access'
import { getPayloadClient } from '@/lib/payload'

const AUTH_COOKIE = 'payload-token'

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value
  if (!token) return null

  try {
    const payload = await getPayloadClient()
    const headers = new Headers()
    headers.set('Authorization', `JWT ${token}`)
    const { user } = await payload.auth({ headers })
    if (!user || user.collection !== 'users') return null
    return user as AppUser
  } catch {
    return null
  }
}

export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export { AUTH_COOKIE }
