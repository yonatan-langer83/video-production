import { AppShell } from '@/components/AppShell'
import { getPayloadClient } from '@/lib/payload'
import { requireUser } from '@/lib/auth'

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const payload = await getPayloadClient()
  const fullUser = await payload.findByID({ collection: 'users', id: user.id })

  return (
    <AppShell userName={fullUser.name || fullUser.email} userRole={fullUser.role}>
      {children}
    </AppShell>
  )
}
