'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CardWithPrices } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PriceTable } from '@/components/cards/price-table'
import { PriceBadge } from '@/components/cards/price-badge'

interface PageProps {
  params: {
    setId: string
    cardId: string
  }
}

export default function CardDetailPage({ params }: PageProps) {
  const [loading, setLoading] = useState(true)
  const [card, setCard] = useState<CardWithPrices | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCardDetail()
  }, [params.cardId])

  const fetchCardDetail = async () => {
    try {
      const response = await fetch(`/api/cards/${params.cardId}`)
      if (!response.ok) {
        throw new Error('カード情報の取得に失敗しました')
      }
      const data: CardWithPrices = await response.json()
      setCard(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pokeca-primary mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'カードが見つかりません'}</p>
          <Link href="/">
            <Button variant="outline">ホームに戻る</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* パンくず */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              ホーム
            </Link>
            <span className="text-gray-400">/</span>
            <Link href={`/sets/${card.setId}`} className="text-gray-500 hover:text-gray-700">
              {card.set.nameJp}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{card.nameJp}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左側: カード画像と基本情報 */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-gray-100 mb-6">
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt={card.nameJp}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-6xl">🎴</span>
                    </div>
                  )}
                </div>

                <h1 className="text-2xl font-bold mb-2">{card.nameJp}</h1>
                {card.nameEn && (
                  <p className="text-gray-600 mb-4">{card.nameEn}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">型番</span>
                    <span className="font-medium">{card.setId}-{card.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">レアリティ</span>
                    <Badge variant="secondary">{card.rarity || 'N/A'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">セット</span>
                    <span className="font-medium">{card.set.nameJp}</span>
                  </div>
                  {card.releaseDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">発売日</span>
                      <span className="font-medium">
                        {new Date(card.releaseDate).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  )}
                </div>

                {/* お気に入り・アラートボタン（後で実装） */}
                <div className="mt-6 space-y-2">
                  <Button variant="outline" className="w-full">
                    ⭐ お気に入りに追加
                  </Button>
                  <Button variant="outline" className="w-full">
                    🔔 価格アラートを設定
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側: 価格情報 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 価格サマリー */}
            {card.snapshot && (
              <Card>
                <CardHeader>
                  <CardTitle>価格情報</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">最安値</p>
                      <PriceBadge
                        価格={card.snapshot.minJpy || 0}
                        showTotal={false}
                        size="lg"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">中央値</p>
                      <p className="text-2xl font-bold">
                        ¥{card.snapshot.medianJpy?.toLocaleString() || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">最高値</p>
                      <p className="text-2xl font-bold text-gray-600">
                        ¥{card.snapshot.maxJpy?.toLocaleString() || '-'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-center mt-4">
                    {card.snapshot.shopCount}店舗の価格を比較
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 価格比較テーブル */}
            <Card>
              <CardHeader>
                <CardTitle>ショップ別価格比較</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <PriceTable prices={card.prices} />
              </CardContent>
            </Card>

            {/* 価格推移チャート（後で実装） */}
            <Card>
              <CardHeader>
                <CardTitle>価格推移</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <p>価格推移チャートは準備中です</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}