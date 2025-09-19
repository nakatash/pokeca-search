// ショップ横断検索API

import { NextRequest, NextResponse } from 'next/server'
import { ShopClientFactory, ShopType, SortOption } from '@/lib/services/shop-clients'
import type { SearchParams, ShopCard } from '@/types/shop-client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // パラメータの取得
    const params: SearchParams = {
      query: searchParams.get('q') || '',
      setCode: searchParams.get('set') || undefined,
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      sortBy: (searchParams.get('sort') as SortOption) || SortOption.PRICE_ASC,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
    }

    // 検索クエリが空の場合はエラー
    if (!params.query) {
      return NextResponse.json(
        { error: '検索クエリを指定してください' },
        { status: 400 }
      )
    }

    // 複数ショップから並行検索
    const shopTypes = [ShopType.POKEMON_TCG, ShopType.CARDRUSH, ShopType.HARERUYA2, ShopType.CARDLABO]
    const searchPromises = shopTypes.map(async (shopType) => {
      try {
        const client = ShopClientFactory.getClient(shopType)
        const result = await client.searchCards(params)
        return result.cards
      } catch (error) {
        console.error(`Failed to search ${shopType}:`, error)
        return []
      }
    })

    const results = await Promise.all(searchPromises)
    const allCards = results.flat()

    // ソート処理
    const sortedCards = sortCards(allCards, params.sortBy || SortOption.PRICE_ASC)

    // ページング処理
    const startIndex = ((params.page || 1) - 1) * (params.limit || 20)
    const endIndex = startIndex + (params.limit || 20)
    const paginatedCards = sortedCards.slice(startIndex, endIndex)

    return NextResponse.json({
      cards: paginatedCards,
      totalCount: sortedCards.length,
      page: params.page || 1,
      limit: params.limit || 20,
      hasMore: endIndex < sortedCards.length,
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// カードのソート処理
function sortCards(cards: ShopCard[], sortBy: SortOption): ShopCard[] {
  const sorted = [...cards]

  switch (sortBy) {
    case SortOption.PRICE_ASC:
      return sorted.sort((a, b) => a.price - b.price)
    case SortOption.PRICE_DESC:
      return sorted.sort((a, b) => b.price - a.price)
    case SortOption.NAME_ASC:
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case SortOption.NAME_DESC:
      return sorted.sort((a, b) => b.name.localeCompare(a.name))
    case SortOption.NEWEST:
      return sorted.sort((a, b) => {
        const dateA = a.lastUpdated?.getTime() || 0
        const dateB = b.lastUpdated?.getTime() || 0
        return dateB - dateA
      })
    case SortOption.POPULARITY:
      // 在庫数や価格を基準に人気度を推定
      return sorted.sort((a, b) => {
        const popularityA = (a.stock || 0) * a.price
        const popularityB = (b.stock || 0) * b.price
        return popularityB - popularityA
      })
    default:
      return sorted
  }
}