'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'

export function ArchiveButton({
  url,
  body,
  label = 'ארכיון',
  confirmText,
  redirectTo,
  size,
  variant = 'secondary',
  className,
}: {
  url: string
  body: Record<string, unknown>
  label?: string
  confirmText: string
  redirectTo?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'secondary' | 'ghost' | 'link'
  className?: string
}) {
  const router = useRouter()

  async function onClick() {
    if (!confirm(confirmText)) return
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      alert('הפעולה נכשלה')
      return
    }
    if (redirectTo) router.push(redirectTo)
    router.refresh()
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => void onClick()}
    >
      {label}
    </Button>
  )
}
