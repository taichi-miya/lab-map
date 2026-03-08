import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { jaJP } from '@clerk/localizations'
import './globals.css'

export const metadata: Metadata = {
  title: '東北大学 研究室マップ | labonavi',
  description: '研究概要の類似度で研究室を2Dマップ化。研究室選びの意思決定を支援します。',
  openGraph: {
    title: '東北大学 研究室マップ | labonavi',
    description: '研究概要の類似度で研究室を2Dマップ化。近いほど研究内容が似ています。',
    url: 'https://www.labonavi.com',
    siteName: 'labonavi',
    locale: 'ja_JP',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={jaJP}>
      <html lang="ja">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
