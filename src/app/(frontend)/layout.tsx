import './globals.css'

import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'

import { getServerUrl } from '@/lib/labels'

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
})

const title = 'הפקות וידאו'
const description = 'מערכת ניהול הפקות ופרקים'

export const metadata: Metadata = {
  metadataBase: new URL(getServerUrl()),
  title: {
    default: title,
    template: `%s | ${title}`,
  },
  description,
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png' }],
  },
  openGraph: {
    title,
    description,
    locale: 'he_IL',
    type: 'website',
    siteName: title,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og.png'],
  },
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className={`${heebo.className} min-h-screen antialiased`}>{children}</body>
    </html>
  )
}
