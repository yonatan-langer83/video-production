import './globals.css'

import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
})

export const metadata: Metadata = {
  title: 'הפקות וידאו',
  description: 'מערכת ניהול הפקות ופרקים',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className={`${heebo.className} min-h-screen antialiased`}>{children}</body>
    </html>
  )
}
