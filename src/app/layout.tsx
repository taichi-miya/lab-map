import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: '東北大学 研究室マップ | Labo Navi',
  description: '研究概要の類似度で研究室を2Dマップ化。研究室選びの意思決定を支援します。',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: '東北大学 研究室マップ | Labo Navi',
    description: '研究概要の類似度で研究室を2Dマップ化。近いほど研究内容が似ています。',
    url: 'https://www.labonavi.com',
    siteName: 'Labo Navi',
    locale: 'ja_JP',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
