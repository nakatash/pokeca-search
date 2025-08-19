import { MarketCard } from '@/types/market'
import { MarketRankingRow } from './market-ranking-row'

interface MarketRankingTableProps {
  cards: MarketCard[]
}

export function MarketRankingTable({ cards }: MarketRankingTableProps) {
  return (
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
        {cards.map((card) => (
          <MarketRankingRow key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}