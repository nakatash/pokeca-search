import { SearchBar } from '@/components/search/search-bar'
import { Card } from '@/types/database'
import Image from 'next/image'
import Link from 'next/link'

// CoinMarketCap風のランキングデータ（モック）
const marketRankingData: (Card & {
  最低価格: number
  市場変動24h: number
  市場変動7d: number
  出来高24h: number
  流通枚数: number
  時価総額: number
  rank: number
})[] = [
  {
    id: 'sv4a-205',
    setId: 'sv4a',
    number: '205',
    nameJp: 'リザードンex',
    nameEn: 'Charizard ex',
    rarity: 'RR',
    imageUrl: 'https://images.pokemontcg.io/sv4a/205.png',
    releaseDate: new Date('2023-10-27'),
    createdAt: new Date(),
    updatedAt: new Date(),
    最低価格: 12800,
    市場変動24h: 15.2,
    市場変動7d: -8.7,
    出来高24h: 4500000,
    流通枚数: 250000,
    時価総額: 3200000000,
    rank: 1,
  },
  {
    id: 'sv4a-190',
    setId: 'sv4a',
    number: '190',
    nameJp: 'ミュウex',
    nameEn: 'Mew ex',
    rarity: 'RR',
    imageUrl: 'https://images.pokemontcg.io/sv4a/190.png',
    releaseDate: new Date('2023-10-27'),
    createdAt: new Date(),
    updatedAt: new Date(),
    最低価格: 8500,
    市場変動24h: -3.8,
    市場変動7d: 12.4,
    出来高24h: 2800000,
    流通枚数: 180000,
    時価総額: 1530000000,
    rank: 2,
  },
  {
    id: 'sv4a-025',
    setId: 'sv4a',
    number: '025',
    nameJp: 'ピカチュウ',
    nameEn: 'Pikachu',
    rarity: 'C',
    imageUrl: 'https://images.pokemontcg.io/sv4a/25.png',
    releaseDate: new Date('2023-10-27'),
    createdAt: new Date(),
    updatedAt: new Date(),
    最低価格: 300,
    市場変動24h: 2.1,
    市場変動7d: 5.8,
    出来高24h: 1200000,
    流通枚数: 2500000,
    時価総額: 750000000,
    rank: 3,
  },
  {
    id: 'sv3a-208',
    setId: 'sv3a',
    number: '208',
    nameJp: 'フシギバナex',
    nameEn: 'Venusaur ex',
    rarity: 'RR',
    imageUrl: 'https://images.pokemontcg.io/sv3a/208.png',
    releaseDate: new Date('2023-09-22'),
    createdAt: new Date(),
    updatedAt: new Date(),
    最低価格: 6200,
    市場変動24h: -1.2,
    市場変動7d: -15.3,
    出来高24h: 890000,
    流通枚数: 120000,
    時価総額: 744000000,
    rank: 4,
  },
  {
    id: 'sv2a-071',
    setId: 'sv2a',
    number: '071',
    nameJp: 'カミツルギex',
    nameEn: 'Kartana ex',
    rarity: 'RR',
    imageUrl: 'https://images.pokemontcg.io/sv2a/71.png',
    releaseDate: new Date('2023-06-16'),
    createdAt: new Date(),
    updatedAt: new Date(),
    最低価格: 4800,
    市場変動24h: 8.9,
    市場変動7d: 22.1,
    出来高24h: 650000,
    流通枚数: 95000,
    時価総額: 456000000,
    rank: 5,
  },
]

function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B'
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

function formatCurrency(yen: number): string {
  return `¥${yen.toLocaleString()}`
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* テーブルヘッダー */}
          <div className="bg-gray-50 px-4 py-3 border-b">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
              <div className="col-span-1">#</div>
              <div className="col-span-4">カード</div>
              <div className="col-span-2 text-right">価格</div>
              <div className="col-span-1 text-right">24h</div>
              <div className="col-span-1 text-right">7d</div>
              <div className="col-span-2 text-right">時価総額</div>
              <div className="col-span-1 text-right">流通量</div>
            </div>
          </div>

          {/* ランキング項目 */}
          <div className="divide-y divide-gray-100">
            {marketRankingData.map((card) => (
              <Link
                key={card.id}
                href={`/cards/${card.setId}/${card.number}`}
                className="block px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* ランク */}
                  <div className="col-span-1">
                    <span className="font-bold text-gray-600">{card.rank}</span>
                  </div>

                  {/* カード情報 */}
                  <div className="col-span-4 flex items-center space-x-3">
                    <div className="relative w-10 h-14 flex-shrink-0">
                      <Image
                        src={card.imageUrl || '/placeholder-card.png'}
                        alt={card.nameJp}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{card.nameJp}</div>
                      <div className="text-sm text-gray-500">
                        {card.setId.toUpperCase()}-{card.number} • {card.rarity}
                      </div>
                    </div>
                  </div>

                  {/* 価格 */}
                  <div className="col-span-2 text-right">
                    <div className="font-medium">{formatCurrency(card.最低価格)}</div>
                  </div>

                  {/* 24h変動 */}
                  <div className="col-span-1 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        card.市場変動24h >= 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {card.市場変動24h >= 0 ? '+' : ''}
                      {card.市場変動24h.toFixed(1)}%
                    </span>
                  </div>

                  {/* 7d変動 */}
                  <div className="col-span-1 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        card.市場変動7d >= 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {card.市場変動7d >= 0 ? '+' : ''}
                      {card.市場変動7d.toFixed(1)}%
                    </span>
                  </div>

                  {/* 時価総額 */}
                  <div className="col-span-2 text-right">
                    <div className="font-medium">{formatCurrency(card.時価総額)}</div>
                    <div className="text-sm text-gray-500">
                      {formatNumber(card.時価総額)}
                    </div>
                  </div>

                  {/* 流通量 */}
                  <div className="col-span-1 text-right">
                    <div className="text-sm font-medium">{formatNumber(card.流通枚数)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-pokeca-primary mb-2">¥45.2B</div>
            <div className="text-gray-600 text-sm">総時価総額</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-pokeca-primary mb-2">¥12.8M</div>
            <div className="text-gray-600 text-sm">24h取引高</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-pokeca-primary mb-2">2,847</div>
            <div className="text-gray-600 text-sm">登録カード数</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="text-2xl font-bold text-pokeca-primary mb-2">67</div>
            <div className="text-gray-600 text-sm">連携ショップ数</div>
          </div>
        </div>
      </section>
    </main>
  )
}