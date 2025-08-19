'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card as CardType } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CardTileProps {
  card: CardType & {
    最低価格?: number
    在庫数?: number
  }
}

export function CardTile({ card }: CardTileProps) {
  return (
    <Link href={`/cards/${card.setId}/${card.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg bg-gray-100">
          {card.imageUrl ? (
            <Image
              src={card.imageUrl}
              alt={card.nameJp}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-4xl">🎴</span>
            </div>
          )}
          {card.rarity && (
            <Badge
              className="absolute top-2 right-2"
              variant="secondary"
            >
              {card.rarity}
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">
            {card.nameJp}
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            {card.setId}-{card.number}
          </p>
          {card.最低価格 !== undefined && (
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-pokeca-primary">
                ¥{card.最低価格.toLocaleString()}
              </span>
              {card.在庫数 !== undefined && (
                <span className="text-xs text-gray-500">
                  在庫: {card.在庫数}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}