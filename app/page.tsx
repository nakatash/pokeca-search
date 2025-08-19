import { SearchBar } from '@/components/search/search-bar'
import { MarketRankingTable, MarketStatsSection } from '@/components/market'
import { mockMarketData, mockMarketStats } from '@/lib/data/mock-market'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-pokeca-bg-light">
      {/* ヘッダーセクション */}
      <section className="bg-pokeca-blue-deep text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
            ポケカ価格ランキング
          </h1>
          <p className="text-center text-lg mb-6 opacity-90">
            時価総額順でポケモンカードの市場動向をリアルタイム把握
          </p>
          <div className="max-w-2xl mx-auto">
            <SearchBar placeholder="カード名・型番で検索（例：リザードン、sv4a-205）" />
          </div>
        </div>
      </section>

      {/* ランキングテーブル */}
      <section className="container mx-auto px-4 py-8">
        <MarketRankingTable cards={mockMarketData} />

        {/* もっと見るボタン */}
        <div className="text-center mt-8">
          <Link
            href="/rankings"
            className="inline-flex items-center px-6 py-3 bg-pokeca-primary text-white rounded-lg hover:bg-pokeca-red-light transition-colors"
          >
            すべてのランキングを見る
          </Link>
        </div>
      </section>

      {/* 市場統計 */}
      <section className="container mx-auto px-4 py-8">
        <MarketStatsSection stats={mockMarketStats} />
      </section>
    </main>
  )
}