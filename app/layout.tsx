import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
})

export const metadata: Metadata = {
  title: 'ポケカサーチ - ポケモンカード価格比較サイト',
  description: 'ポケモンカードの価格を複数ショップで横断比較。最安値検索、相場チャート、在庫確認が可能。',
  keywords: 'ポケモンカード,ポケカ,価格比較,相場,最安値',
  openGraph: {
    title: 'ポケカサーチ',
    description: 'ポケモンカードの価格比較・相場情報サイト',
    type: 'website',
    locale: 'ja_JP',
    siteName: 'ポケカサーチ',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className="bg-pokeca-light text-gray-900 min-h-screen flex flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  )
}