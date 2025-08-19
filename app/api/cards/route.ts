import { NextRequest, NextResponse } from 'next/server'
import { Card } from '@/types/database'

// モックデータ（実際にはデータベースから取得）
const mockCards: Card[] = [
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
  },
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
  },
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const set = searchParams.get('set')
    const rarity = searchParams.get('rarity')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // フィルタリング（実際にはSQLクエリで行う）
    let filteredCards = [...mockCards]

    if (query) {
      const lowerQuery = query.toLowerCase()
      filteredCards = filteredCards.filter(
        (card) =>
          card.nameJp.toLowerCase().includes(lowerQuery) ||
          card.nameEn?.toLowerCase().includes(lowerQuery) ||
          card.number.includes(query)
      )
    }

    if (set) {
      filteredCards = filteredCards.filter((card) => card.setId === set)
    }

    if (rarity) {
      filteredCards = filteredCards.filter((card) => card.rarity === rarity)
    }

    // ページネーション
    const totalCount = filteredCards.length
    const paginatedCards = filteredCards.slice(offset, offset + limit)

    // レスポンス
    return NextResponse.json({
      cards: paginatedCards,
      totalCount,
      limit,
      offset,
    })
  } catch (error) {
    console.error('カード検索エラー:', error)
    return NextResponse.json(
      { error: 'カードの検索中にエラーが発生しました' },
      { status: 500 }
    )
  }
}