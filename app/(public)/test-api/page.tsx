'use client'

import { useState, useEffect } from 'react'
import { MarketCard, MarketStats } from '@/types/market'
import { MarketRankingTable, MarketStatsSection } from '@/components/market'
import { Loading } from '@/components/ui/loading'
import { ErrorDisplay } from '@/components/ui/error-boundary'

export default function TestAPIPage() {
  const [cards, setCards] = useState<MarketCard[]>([])
  const [stats, setStats] = useState<MarketStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 実データを取得するAPIをテスト
        const [cardsResponse, statsResponse] = await Promise.all([
          fetch('/api/test/cards'),
          fetch('/api/test/stats')
        ])

        if (!cardsResponse.ok || !statsResponse.ok) {
          throw new Error('APIエラーが発生しました')
        }

        const cardsData = await cardsResponse.json()
        const statsData = await statsResponse.json()

        setCards(cardsData)
        setStats(statsData)
      } catch (err) {
        console.error('データ取得エラー:', err)
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-pokeca-bg-light flex items-center justify-center">
        <Loading size="lg" text="実データを取得中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-pokeca-bg-light p-8">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Pokemon TCG API テスト</h1>
          <ErrorDisplay 
            title="APIテストエラー"
            message={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pokeca-bg-light">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Pokemon TCG API テスト
        </h1>
        
        {/* APIステータス */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <span className="text-2xl text-green-600 mr-3">✅</span>
            <div>
              <h3 className="font-semibold text-green-800">APIテスト成功</h3>
              <p className="text-green-700 text-sm">
                Pokemon TCG APIから{cards.length}件のカードデータを取得しました
              </p>
            </div>
          </div>
        </div>

        {/* マーケット統計 */}
        {stats && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">マーケット統計（実データ）</h2>
            <MarketStatsSection stats={stats} />
          </section>
        )}

        {/* ランキングテーブル */}
        <section>
          <h2 className="text-2xl font-bold mb-6">
            人気カードランキング（実データ）
          </h2>
          <MarketRankingTable cards={cards} />
        </section>

        {/* データソース情報 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">データソース情報</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• <strong>カード情報</strong>: Pokemon TCG API (pokemontcg.io)</li>
            <li>• <strong>価格情報</strong>: TCGPlayer / CardMarket</li>
            <li>• <strong>更新頻度</strong>: リアルタイム（APIキャッシュ: 1時間）</li>
            <li>• <strong>為替レート</strong>: 1USD = 150円, 1EUR = 165円（固定値）</li>
          </ul>
        </div>
      </div>
    </div>
  )
}