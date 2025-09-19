// Pokemon TCG API クライアント

import { BaseShopClient } from './base-client'
import {
  SearchParams,
  SearchResult,
  ShopCard,
  StockStatus,
  CardLanguage,
  SortOption,
} from '@/types/shop-client'

// Pokemon TCG APIのレスポンス型
interface PokemonTCGCard {
  id: string
  name: string
  supertype: string
  subtypes: string[]
  level?: string
  hp?: string
  types?: string[]
  evolvesFrom?: string
  evolvesTo?: string[]
  rules?: string[]
  ancientTrait?: {
    name: string
    text: string
  }
  abilities?: Array<{
    name: string
    text: string
    type: string
  }>
  attacks?: Array<{
    name: string
    cost: string[]
    convertedEnergyCost: number
    damage: string
    text: string
  }>
  weaknesses?: Array<{
    type: string
    value: string
  }>
  resistances?: Array<{
    type: string
    value: string
  }>
  retreatCost?: string[]
  convertedRetreatCost?: number
  set: {
    id: string
    name: string
    series: string
    printedTotal: number
    total: number
    legalities: {
      unlimited?: string
      expanded?: string
      standard?: string
    }
    ptcgoCode?: string
    releaseDate: string
    updatedAt: string
    images: {
      symbol: string
      logo: string
    }
  }
  number: string
  artist?: string
  rarity?: string
  flavorText?: string
  nationalPokedexNumbers?: number[]
  legalities: {
    unlimited?: string
    expanded?: string
    standard?: string
  }
  regulationMark?: string
  images: {
    small: string
    large: string
  }
  tcgplayer?: {
    url: string
    updatedAt: string
    prices?: {
      normal?: {
        low: number | null
        mid: number | null
        high: number | null
        market: number | null
        directLow: number | null
      }
      holofoil?: {
        low: number | null
        mid: number | null
        high: number | null
        market: number | null
        directLow: number | null
      }
      reverseHolofoil?: {
        low: number | null
        mid: number | null
        high: number | null
        market: number | null
        directLow: number | null
      }
      '1stEditionHolofoil'?: {
        low: number | null
        mid: number | null
        high: number | null
        market: number | null
        directLow: number | null
      }
      '1stEditionNormal'?: {
        low: number | null
        mid: number | null
        high: number | null
        market: number | null
        directLow: number | null
      }
    }
  }
  cardmarket?: {
    url: string
    updatedAt: string
    prices?: {
      averageSellPrice: number | null
      lowPrice: number | null
      trendPrice: number | null
      germanProLow: number | null
      suggestedPrice: number | null
      reverseHoloSell: number | null
      reverseHoloLow: number | null
      reverseHoloTrend: number | null
      lowPriceExPlus: number | null
      avg1: number | null
      avg7: number | null
      avg30: number | null
      reverseHoloAvg1: number | null
      reverseHoloAvg7: number | null
      reverseHoloAvg30: number | null
    }
  }
}

interface PokemonTCGResponse {
  data: PokemonTCGCard[]
  page: number
  pageSize: number
  count: number
  totalCount: number
}

export class PokemonTCGClient extends BaseShopClient {
  private readonly apiKey?: string
  private readonly apiBaseUrl = 'https://api.pokemontcg.io/v2'

  constructor(apiKey?: string) {
    super(
      'Pokemon TCG API',
      'https://pokemontcg.io',
      true,
      { maxRequests: apiKey ? 1000 : 250, perSeconds: 60 } // APIキーありなら1000req/分、なしなら250req/分
    )
    this.apiKey = apiKey

    if (apiKey) {
      this.headers['X-Api-Key'] = apiKey
    }
  }

  async searchCards(params: SearchParams): Promise<SearchResult> {
    const queryParams = this.buildQueryParams(params)
    const url = `${this.apiBaseUrl}/cards?${queryParams.toString()}`

    this.log('Searching cards', { url, params })

    const response = await this.fetchWithRetry(url)
    const data: PokemonTCGResponse = await response.json()

    const cards = data.data.map((card) => this.convertToShopCard(card))

    return {
      cards,
      totalCount: data.totalCount,
      page: data.page,
      limit: data.pageSize,
      hasMore: data.page * data.pageSize < data.totalCount,
    }
  }

  async getCardDetail(cardId: string): Promise<ShopCard | null> {
    const url = `${this.apiBaseUrl}/cards/${cardId}`

    this.log('Getting card detail', { url, cardId })

    try {
      const response = await this.fetchWithRetry(url)
      const data = await response.json()

      if (!data.data) {
        return null
      }

      return this.convertToShopCard(data.data)
    } catch (error) {
      this.log('Failed to get card detail', error)
      return null
    }
  }

  private buildQueryParams(params: SearchParams): URLSearchParams {
    const queryParts: string[] = []

    // 検索クエリ
    if (params.query) {
      // 名前で検索
      queryParts.push(`name:"*${params.query}*"`)
    }

    // セットコードフィルター
    if (params.setCode) {
      queryParts.push(`set.id:${params.setCode}`)
    }

    // 価格フィルター（TCGPlayerの市場価格を使用）
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      const minPrice = params.minPrice ? params.minPrice / 150 : 0 // 円→ドル変換（概算）
      const maxPrice = params.maxPrice ? params.maxPrice / 150 : 10000

      queryParts.push(`tcgplayer.prices.normal.market:[${minPrice} TO ${maxPrice}]`)
    }

    const urlParams = new URLSearchParams()

    // クエリを結合
    if (queryParts.length > 0) {
      urlParams.append('q', queryParts.join(' '))
    }

    // ページング
    urlParams.append('page', String(params.page || 1))
    urlParams.append('pageSize', String(params.limit || 20))

    // ソート
    const sortMap: Record<SortOption, string> = {
      [SortOption.PRICE_ASC]: 'tcgplayer.prices.normal.market',
      [SortOption.PRICE_DESC]: '-tcgplayer.prices.normal.market',
      [SortOption.NAME_ASC]: 'name',
      [SortOption.NAME_DESC]: '-name',
      [SortOption.NEWEST]: '-set.releaseDate',
      [SortOption.POPULARITY]: '-hp', // HPで代用（人気度のデータがないため）
    }

    if (params.sortBy && sortMap[params.sortBy]) {
      urlParams.append('orderBy', sortMap[params.sortBy])
    }

    return urlParams
  }

  private convertToShopCard(card: PokemonTCGCard): ShopCard {
    // 価格の取得（優先順位: market → mid → low）
    let price = 0
    let originalPrice: number | undefined

    if (card.tcgplayer?.prices) {
      const prices = card.tcgplayer.prices
      const priceSet =
        prices.holofoil ||
        prices.reverseHolofoil ||
        prices.normal ||
        prices['1stEditionHolofoil'] ||
        prices['1stEditionNormal']

      if (priceSet) {
        // 市場価格
        if (priceSet.market) {
          price = Math.round(priceSet.market * 150) // ドル→円変換（概算）
        } else if (priceSet.mid) {
          price = Math.round(priceSet.mid * 150)
        } else if (priceSet.low) {
          price = Math.round(priceSet.low * 150)
        }

        // 元価格（high価格を使用）
        if (priceSet.high) {
          originalPrice = Math.round(priceSet.high * 150)
        }
      }
    }

    // カードマーケットの価格も参考に
    if (!price && card.cardmarket?.prices?.trendPrice) {
      price = Math.round(card.cardmarket.prices.trendPrice * 180) // ユーロ→円変換（概算）
    }

    return {
      id: card.id,
      name: card.name,
      nameEn: card.name,
      setName: card.set.name,
      setCode: card.set.id,
      cardNumber: card.number,
      rarity: card.rarity,
      language: CardLanguage.ENGLISH, // Pokemon TCG APIは主に英語カード
      price: price || 0,
      originalPrice,
      discountRate: originalPrice && price ? ((originalPrice - price) / originalPrice) * 100 : undefined,
      stockStatus: StockStatus.IN_STOCK, // APIには在庫情報がないため
      imageUrl: card.images.large,
      thumbnailUrl: card.images.small,
      shopName: this.shopName,
      shopUrl: card.tcgplayer?.url || `https://pokemontcg.io/cards/${card.id}`,
      lastUpdated: new Date(card.tcgplayer?.updatedAt || card.cardmarket?.updatedAt || new Date()),
    }
  }
}