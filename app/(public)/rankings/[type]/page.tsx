'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { RankingCard } from '@/components/cards/ranking-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RankingType } from '@/types/database'

interface RankingData {
  ranking: {
    id: number
    cardId: string
    type: RankingType
    deltaPercent24h?: number
    deltaPercent7d?: number
    rank: number
    updatedAt: string
  }
  card: {
    id: string
    setId: string
    number: string
    nameJp: string
    nameEn?: string
    rarity?: string
    imageUrl?: string
  }
  setInfo: {
    nameJp: string
    code: string
  }
  currentPrice?: number
}

interface RankingResponse {
  type: RankingType
  rankings: RankingData[]
  limit: number
  updatedAt: string
}

const RANKING_TYPES = {
  'spike_24h': {
    title: '24時間高騰ランキング',
    description: '過去24時間で価格が上昇したカード',
    icon: '📈',
    type: 'spike' as const,
  },
  'drop_24h': {
    title: '24時間下落ランキング',
    description: '過去24時間で価格が下落したカード',
    icon: '📉',
    type: 'drop' as const,
  },
  'spike_7d': {
    title: '7日間高騰ランキング',
    description: '過去7日間で価格が上昇したカード',
    icon: '📈',
    type: 'spike' as const,
  },
  'drop_7d': {
    title: '7日間下落ランキング',
    description: '過去7日間で価格が下落したカード',
    icon: '📉',
    type: 'drop' as const,
  },
} as const

export default function RankingPage() {
  const params = useParams()
  const rankingType = params.type as RankingType
  const [loading, setLoading] = useState(true)
  const [rankings, setRankings] = useState<RankingResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rankingInfo = RANKING_TYPES[rankingType]

  useEffect(() => {
    if (rankingType) {
      fetchRankings()
    }
  }, [rankingType])

  const fetchRankings = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/rankings?type=${rankingType}`)
      if (!response.ok) {
        throw new Error('ランキングの取得に失敗しました')
      }
      const data: RankingResponse = await response.json()
      setRankings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (!rankingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">無効なランキングタイプです</p>
          <Link href="/rankings/spike_24h">
            <Button variant="outline">24時間高騰ランキングへ</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{rankingInfo.icon}</span>
            <h1 className="text-3xl font-bold">{rankingInfo.title}</h1>
          </div>
          <p className="text-gray-600 mb-6">{rankingInfo.description}</p>

          {/* ランキングタイプ選択 */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(RANKING_TYPES).map(([type, info]) => (
              <Link key={type} href={`/rankings/${type}`}>
                <Button
                  variant={type === rankingType ? 'primary' : 'outline'}
                  size="sm"
                >
                  {info.icon} {info.title}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* メインコンテンツ */}
      <section className="container mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pokeca-primary mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchRankings} variant="outline" size="sm" className="mt-2">
              再読み込み
            </Button>
          </div>
        )}

        {rankings && (
          <>
            {/* 更新情報 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  {rankings.rankings.length}件のカード
                </Badge>
                <span className="text-sm text-gray-500">
                  最終更新: {new Date(rankings.updatedAt).toLocaleString('ja-JP')}
                </span>
              </div>
              <Button onClick={fetchRankings} variant="outline" size="sm">
                🔄 更新
              </Button>
            </div>

            {/* ランキングリスト */}
            <div className="space-y-4">
              {rankings.rankings.map((item, index) => (
                <RankingCard
                  key={item.card.id}
                  rank={item.ranking.rank}
                  card={item.card}
                  setInfo={item.setInfo}
                  currentPrice={item.currentPrice}
                  deltaPercent={item.ranking.deltaPercent24h || item.ranking.deltaPercent7d}
                  rankingType={rankingInfo.type}
                />
              ))}
            </div>

            {rankings.rankings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  現在、{rankingInfo.title}はありません
                </p>
                <p className="text-sm text-gray-500">
                  価格データが蓄積され次第、ランキングを表示します
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}