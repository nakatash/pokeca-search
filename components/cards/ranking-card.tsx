import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface RankingCardProps {
  rank: number
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
  deltaPercent?: number
  rankingType: 'spike' | 'drop'
}

export function RankingCard({
  rank,
  card,
  setInfo,
  currentPrice,
  deltaPercent,
  rankingType,
}: RankingCardProps) {
  const isSpike = rankingType === 'spike'
  const deltaColor = isSpike ? 'text-red-600' : 'text-blue-600'
  const deltaIcon = isSpike ? '📈' : '📉'
  const badgeVariant = isSpike ? 'danger' : 'success'

  return (
    <Link href={`/cards/${card.setId}/${card.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* 順位 */}
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="font-bold text-lg">#{rank}</span>
            </div>

            {/* カード画像 */}
            <div className="flex-shrink-0 w-16 h-20 relative overflow-hidden rounded bg-gray-100">
              {card.imageUrl ? (
                <Image
                  src={card.imageUrl}
                  alt={card.nameJp}
                  fill
                  className="object-contain"
                  sizes="64px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-2xl">🎴</span>
                </div>
              )}
            </div>

            {/* カード情報 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1 truncate">
                {card.nameJp}
              </h3>
              <p className="text-xs text-gray-500 mb-1">
                {setInfo.code}-{card.number}
              </p>
              <p className="text-xs text-gray-400">
                {setInfo.nameJp}
              </p>
              {card.rarity && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {card.rarity}
                </Badge>
              )}
            </div>

            {/* 価格・変動率 */}
            <div className="flex-shrink-0 text-right">
              {currentPrice && (
                <div className="font-bold text-lg mb-1">
                  ¥{currentPrice.toLocaleString()}
                </div>
              )}
              {deltaPercent !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="text-lg">{deltaIcon}</span>
                  <Badge variant={badgeVariant} className="text-xs">
                    {deltaPercent > 0 ? '+' : ''}{deltaPercent.toFixed(1)}%
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}