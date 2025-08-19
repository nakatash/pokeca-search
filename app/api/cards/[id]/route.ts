import { NextRequest, NextResponse } from 'next/server'
import { CardWithPrices, CardPriceWithShop } from '@/types/database'

// モックデータ
const mockCardDetail: CardWithPrices = {
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
  set: {
    id: 'sv4a',
    code: 'SV4a',
    nameJp: 'シャイニートレジャーex',
    nameEn: 'Shiny Treasure ex',
    releaseDate: new Date('2023-10-27'),
    imageUrl: 'https://images.pokemontcg.io/sv4a/logo.png',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  prices: [
    {
      id: 1,
      cardId: 'sv4a-205',
      shopId: 1,
      condition: 'NM',
      priceJpy: 12800,
      shippingJpy: 200,
      stockQty: 3,
      etaDays: 2,
      url: 'https://example.com/shop1/sv4a-205',
      collectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      shop: {
        id: 1,
        name: '晴れる屋',
        url: 'https://www.hareruyamtg.com',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      総コスト: 13000,
    },
    {
      id: 2,
      cardId: 'sv4a-205',
      shopId: 2,
      condition: 'NM',
      priceJpy: 13500,
      shippingJpy: 0,
      stockQty: 1,
      etaDays: 3,
      url: 'https://example.com/shop2/sv4a-205',
      collectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      shop: {
        id: 2,
        name: '駿河屋',
        url: 'https://www.suruga-ya.jp',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      総コスト: 13500,
    },
  ],
  snapshot: {
    id: 1,
    cardId: 'sv4a-205',
    ts: new Date(),
    minJpy: 12800,
    medianJpy: 13150,
    maxJpy: 13500,
    shopCount: 2,
    createdAt: new Date(),
  },
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cardId = params.id

    // 実際にはデータベースから取得
    if (cardId !== 'sv4a-205') {
      return NextResponse.json(
        { error: 'カードが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(mockCardDetail)
  } catch (error) {
    console.error('カード詳細取得エラー:', error)
    return NextResponse.json(
      { error: 'カード情報の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}