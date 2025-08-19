'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SearchBar } from '@/components/search/search-bar'
import { Button } from '@/components/ui/button'

export function Header() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  return (
    <header className="bg-black text-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🎴</span>
            <span className="font-bold text-xl text-pokeca-red-primary">
              ポケカサーチ
            </span>
          </Link>

          {/* 検索バー（ホーム以外で表示） */}
          {!isHomePage && (
            <div className="hidden md:block flex-1 max-w-xl mx-8">
              <SearchBar placeholder="カード名・型番で検索" />
            </div>
          )}

          {/* ナビゲーション */}
          <nav className="flex items-center gap-4">
            <Link href="/rankings/spike-24h">
              <Button variant="ghost" size="sm">
                ランキング
              </Button>
            </Link>
            <Link href="/blog">
              <Button variant="ghost" size="sm">
                ブログ
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              ログイン
            </Button>
          </nav>
        </div>

        {/* モバイル用検索バー */}
        {!isHomePage && (
          <div className="md:hidden pb-4">
            <SearchBar placeholder="カード名・型番で検索" />
          </div>
        )}
      </div>
    </header>
  )
}