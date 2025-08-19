import Image from 'next/image'
import Link from 'next/link'
import { MarketCard } from '@/types/market'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { PriceChangeBadge } from './price-change-badge'

interface MarketRankingRowProps {
  card: MarketCard
}

export function MarketRankingRow({ card }: MarketRankingRowProps) {
  return (
    <Link
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
          <PriceChangeBadge value={card.市場変動24h} />
        </div>

        {/* 7d変動 */}
        <div className="col-span-1 text-right">
          <PriceChangeBadge value={card.市場変動7d} />
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
  )
}