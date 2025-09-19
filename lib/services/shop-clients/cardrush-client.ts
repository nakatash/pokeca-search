// カードラッシュ HTMLスクレイピングクライアント

import { BaseShopClient } from './base-client'
import {
  SearchParams,
  SearchResult,
  ShopCard,
  CardCondition,
  CardLanguage,
  StockStatus,
  SortOption,
  ShopClientError,
} from '@/types/shop-client'

// HTMLパーサー用（サーバーサイドのみ）
let cheerio: any
if (typeof window === 'undefined') {
  try {
    cheerio = require('cheerio')
  } catch (error) {
    console.warn('cheerio not available - HTML parsing will not work')
  }
}

export class CardRushClient extends BaseShopClient {
  private baseSearchUrl = 'https://www.cardrush-pokemon.jp'

  constructor() {
    super(
      'カードラッシュ',
      'https://www.cardrush-pokemon.jp',
      false, // HTMLスクレイピング
      { maxRequests: 1, perSeconds: 3 } // 3秒に1回の制限
    )
  }

  async searchCards(params: SearchParams): Promise<SearchResult> {
    if (!cheerio) {
      throw new ShopClientError(
        'cheerio is not available for HTML parsing',
        this.shopName,
        'PARSER_UNAVAILABLE'
      )
    }

    const searchUrl = this.buildSearchUrl(params)
    this.log('Searching cards', { url: searchUrl, params })

    try {
      const response = await this.fetchWithRetry(searchUrl)
      const html = await response.text()

      const cards = this.parseSearchResults(html, params.page || 1)

      return {
        cards,
        totalCount: cards.length * 10, // 概算（正確な総数は取得困難）
        page: params.page || 1,
        limit: params.limit || 20,
        hasMore: cards.length >= (params.limit || 20), // 最大件数に達した場合は次ページあり
      }
    } catch (error) {
      this.log('Search failed', error)
      throw new ShopClientError(
        `検索に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        this.shopName,
        'SEARCH_ERROR'
      )
    }
  }

  async getCardDetail(cardId: string): Promise<ShopCard | null> {
    // カードラッシュでは商品IDから直接詳細ページにアクセス
    const detailUrl = `${this.baseSearchUrl}/detail.php?itemid=${cardId}`

    try {
      const response = await this.fetchWithRetry(detailUrl)
      const html = await response.text()

      return this.parseCardDetail(html, cardId)
    } catch (error) {
      this.log('Failed to get card detail', { cardId, error })
      return null
    }
  }

  // 検索URLの構築
  private buildSearchUrl(params: SearchParams): string {
    const searchParams = new URLSearchParams()

    // 基本的な検索クエリ
    if (params.query) {
      searchParams.append('q', params.query)
    }

    // 価格範囲
    if (params.minPrice) {
      searchParams.append('min_price', params.minPrice.toString())
    }
    if (params.maxPrice) {
      searchParams.append('max_price', params.maxPrice.toString())
    }

    // ページネーション
    const page = params.page || 1
    if (page > 1) {
      searchParams.append('p', page.toString())
    }

    // ソート（カードラッシュ固有の形式に変換）
    if (params.sortBy) {
      const sortValue = this.convertSortOption(params.sortBy)
      if (sortValue) {
        searchParams.append('sort', sortValue)
      }
    }

    // カードラッシュの検索URL形式に合わせる
    const queryString = searchParams.toString()
    if (queryString) {
      return `${this.baseSearchUrl}/xml.php?go=search&${queryString}`
    } else {
      return `${this.baseSearchUrl}/xml.php?go=search`
    }
  }

  // ソートオプションの変換
  private convertSortOption(sortBy: SortOption): string | null {
    const sortMap: Record<SortOption, string> = {
      [SortOption.PRICE_ASC]: 'price_asc',
      [SortOption.PRICE_DESC]: 'price_desc',
      [SortOption.NAME_ASC]: 'name_asc',
      [SortOption.NAME_DESC]: 'name_desc',
      [SortOption.NEWEST]: 'new',
      [SortOption.POPULARITY]: 'popular',
    }
    return sortMap[sortBy] || null
  }

  // 検索結果のHTMLパース
  private parseSearchResults(html: string, page: number): ShopCard[] {
    const $ = cheerio.load(html)
    const cards: ShopCard[] = []

    // 商品アイテムを抽出（クラス名は調査結果に基づく）
    $('.ajax_itemlist_box .item, .product-item, .itembox').each((index: number, element: any) => {
      try {
        const card = this.parseProductElement($, element, page, index)
        if (card) {
          cards.push(card)
        }
      } catch (error) {
        this.log('Failed to parse product element', error)
      }
    })

    return cards
  }

  // 個別商品要素のパース
  private parseProductElement($: any, element: any, page: number, index: number): ShopCard | null {
    const $item = $(element)

    // カード名の抽出
    const name = this.extractCardName($item)
    if (!name) return null

    // 価格の抽出
    const price = this.extractPrice($item)
    if (!price || price <= 0) return null

    // 商品IDの抽出（リンクから）
    const productLink = $item.find('a').first().attr('href') || ''
    const productId = this.extractProductId(productLink) || `cr-${page}-${index}`

    // 画像URLの抽出
    const imageUrl = this.extractImageUrl($item)

    // 在庫情報の抽出
    const stockInfo = this.extractStockInfo($item)

    // セット情報とカード番号の推測
    const cardInfo = this.parseCardInfo(name)

    return {
      id: productId,
      name: name,
      nameEn: cardInfo.nameEn,
      setName: cardInfo.setName,
      setCode: cardInfo.setCode,
      cardNumber: cardInfo.cardNumber,
      rarity: cardInfo.rarity,
      condition: CardCondition.NEAR_MINT, // カードラッシュのデフォルト
      language: CardLanguage.JAPANESE,
      price: price,
      stock: stockInfo.quantity,
      stockStatus: stockInfo.status,
      imageUrl: imageUrl,
      shopName: this.shopName,
      shopUrl: `${this.baseSearchUrl}${productLink}`,
      lastUpdated: new Date(),
    }
  }

  // カード名の抽出
  private extractCardName($item: any): string | null {
    // 複数のセレクターを試行
    const selectors = [
      '.item-title',
      '.product-name',
      '.itemname',
      'h3',
      'h4',
      '.title',
      'a[title]'
    ]

    for (const selector of selectors) {
      const nameElement = $item.find(selector).first()
      if (nameElement.length > 0) {
        const name = nameElement.text().trim() || nameElement.attr('title')
        if (name && name.length > 0) {
          return this.cleanCardName(name)
        }
      }
    }

    return null
  }

  // 価格の抽出
  private extractPrice($item: any): number {
    const selectors = [
      '.price',
      '.price_data',
      '.item-price',
      '.cost',
      '[class*="price"]'
    ]

    for (const selector of selectors) {
      const priceElement = $item.find(selector).first()
      if (priceElement.length > 0) {
        const priceText = priceElement.text().trim()
        const price = this.parsePriceString(priceText)
        if (price > 0) {
          return price
        }
      }
    }

    return 0
  }

  // 商品IDの抽出
  private extractProductId(link: string): string | null {
    // detail.php?itemid=123 形式から抽出
    const match = link.match(/itemid=([^&]+)/)
    return match ? match[1] : null
  }

  // 画像URLの抽出
  private extractImageUrl($item: any): string | undefined {
    const img = $item.find('img').first()
    if (img.length > 0) {
      let src = img.attr('src') || img.attr('data-src')
      if (src) {
        // 相対URLを絶対URLに変換
        if (src.startsWith('/')) {
          src = `${this.baseSearchUrl}${src}`
        }
        return src
      }
    }
    return undefined
  }

  // 在庫情報の抽出
  private extractStockInfo($item: any): { quantity?: number; status: StockStatus } {
    const stockText = $item.find('[class*="stock"], [class*="zaiko"]').text().trim()

    if (stockText.includes('在庫切れ') || stockText.includes('売切')) {
      return { status: StockStatus.OUT_OF_STOCK }
    }

    if (stockText.includes('残り') || stockText.includes('在庫数')) {
      const quantity = this.parseStockString(stockText)
      if (quantity !== undefined) {
        if (quantity <= 3) {
          return { quantity, status: StockStatus.LOW_STOCK }
        } else {
          return { quantity, status: StockStatus.IN_STOCK }
        }
      }
    }

    // デフォルトは在庫ありとみなす
    return { status: StockStatus.IN_STOCK }
  }

  // カード名からセット情報を推測
  private parseCardInfo(name: string): {
    nameEn?: string
    setName?: string
    setCode?: string
    cardNumber?: string
    rarity?: string
  } {
    // セット名のパターンマッチング
    const setPatterns = [
      { pattern: /SV4a|シャイニートレジャー/, setCode: 'sv4a', setName: 'シャイニートレジャーex' },
      { pattern: /SV3a|レイジングサーフ/, setCode: 'sv3a', setName: 'レイジングサーフ' },
      { pattern: /SV2a|ポケモンカード151/, setCode: 'sv2a', setName: 'ポケモンカード151' },
    ]

    for (const { pattern, setCode, setName } of setPatterns) {
      if (pattern.test(name)) {
        return { setCode, setName }
      }
    }

    return {}
  }

  // カード名のクリーニング
  private cleanCardName(name: string): string {
    return name
      .replace(/【[^】]*】/g, '') // 【】内を削除
      .replace(/\([^)]*\)/g, '') // ()内を削除
      .replace(/\s+/g, ' ') // 複数の空白を1つに
      .trim()
  }

  // カード詳細ページのパース
  private parseCardDetail(html: string, cardId: string): ShopCard | null {
    const $ = cheerio.load(html)

    try {
      // 詳細ページから情報を抽出
      const name = $('h1, .item-title, .product-name').first().text().trim()
      if (!name) return null

      const price = this.extractPrice($)
      if (!price) return null

      return {
        id: cardId,
        name: this.cleanCardName(name),
        price: price,
        shopName: this.shopName,
        shopUrl: `${this.baseSearchUrl}/detail.php?itemid=${cardId}`,
        stockStatus: StockStatus.IN_STOCK,
        language: CardLanguage.JAPANESE,
        lastUpdated: new Date(),
      }
    } catch (error) {
      this.log('Failed to parse card detail', error)
      return null
    }
  }
}