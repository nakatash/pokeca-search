import { SearchBar } from '@/components/search/search-bar'
import { CardTile } from '@/components/cards/card-tile'
import { Card } from '@/types/database'

// 人気カードのモックデータ
const popularCards: (Card & { 最低価格: number; 在庫数: number })[] = [
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
    在庫数: 3,
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
    在庫数: 5,
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
    在庫数: 20,
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヒーローセクション */}
      <section className="bg-gradient-to-br from-pokeca-primary to-pokeca-secondary text-white">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            ポケカサーチ
          </h1>
          <p className="text-center text-lg mb-8 opacity-90">
            ポケモンカードの価格を複数ショップで横断比較
          </p>
          <div className="max-w-2xl mx-auto">
            <SearchBar placeholder="カード名・型番で検索（例：リザードン、sv4a-205）" />
          </div>
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-semibold mb-2">複数ショップ横断検索</h3>
            <p className="text-sm text-gray-600">
              晴れる屋、駿河屋など主要ショップの価格を一括比較
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="font-semibold mb-2">価格推移チャート</h3>
            <p className="text-sm text-gray-600">
              過去の価格推移から相場の動きを把握
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="font-semibold mb-2">価格アラート</h3>
            <p className="text-sm text-gray-600">
              目標価格に到達したらメール・LINEで通知
            </p>
          </div>
        </div>
      </section>

      {/* 人気カード */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">人気のカード</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {popularCards.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      </section>
    </main>
  )
}