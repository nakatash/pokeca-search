// 晴れる屋2 (Hareruya2) HTMLスクレイピングクライアント
// Shopifyベースのポケモンカード専門店

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

// Shopify検索用のエンドポイント
interface ShopifySearchResponse {
  results: {
    title: string
    url: string
    price: number
    compare_at_price?: number
    available: boolean
    image: string
    tags: string[]
    product_type: string
    vendor: string
  }[]
}

export class Hareruya2Client extends BaseShopClient {
  private readonly collections = {
    sv: '/collections/sv', // スカーレット&バイオレット
    swsh: '/collections/swsh', // ソード&シールド
    sm: '/collections/sm', // サン&ムーン
    xy: '/collections/xy', // XY
    bw: '/collections/bw', // ブラック&ホワイト
    all: '/collections/all', // 全商品
  }

  constructor() {
    super(
      '晴れる屋2',
      'https://www.hareruya2.com',
      false, // HTMLスクレイピング
      { maxRequests: 1, perSeconds: 2 } // 2秒に1回の制限（Shopifyサイトなので少し緩め）
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

    try {
      // Shopifyの検索APIを試行し、ダメならHTMLスクレイピング
      const cards = await this.searchViaShopifyApi(params)
        .catch(() => this.searchViaHtmlScraping(params))

      return {
        cards,
        totalCount: cards.length * 5, // 概算
        page: params.page || 1,
        limit: params.limit || 20,
        hasMore: cards.length >= (params.limit || 20),
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
    // カードIDから商品URLを構築
    const productUrl = cardId.startsWith('/') ?
      `${this.baseUrl}${cardId}` :
      `${this.baseUrl}/products/${cardId}`

    try {
      const response = await this.fetchWithRetry(productUrl)
      const html = await response.text()

      return this.parseProductDetail(html, cardId)
    } catch (error) {
      this.log('Failed to get card detail', { cardId, error })
      return null
    }
  }

  // Shopify検索API経由での検索
  private async searchViaShopifyApi(params: SearchParams): Promise<ShopCard[]> {
    const searchUrl = this.buildShopifySearchUrl(params)

    try {
      const response = await this.fetchWithRetry(searchUrl, {
        headers: {
          ...this.headers,
          'Accept': 'application/json',
        }
      })

      const data: ShopifySearchResponse = await response.json()

      return data.results.map((item, index) => this.convertShopifyResultToCard(item, index))
    } catch (error) {
      this.log('Shopify API search failed, falling back to HTML scraping', error)
      throw error
    }
  }

  // HTMLスクレイピング経由での検索
  private async searchViaHtmlScraping(params: SearchParams): Promise<ShopCard[]> {
    const searchUrl = this.buildHtmlSearchUrl(params)
    this.log('Searching via HTML scraping', { url: searchUrl })

    const response = await this.fetchWithRetry(searchUrl)
    const html = await response.text()

    return this.parseSearchResults(html)
  }

  // Shopify検索URLの構築
  private buildShopifySearchUrl(params: SearchParams): string {
    const searchParams = new URLSearchParams()

    if (params.query) {
      searchParams.append('q', params.query)
    }

    // 価格フィルター
    if (params.minPrice || params.maxPrice) {
      const priceFilter = `${params.minPrice || 0}:${params.maxPrice || 999999}`
      searchParams.append('filter.p.price', priceFilter)
    }

    // リミット
    searchParams.append('limit', String(params.limit || 20))

    return `${this.baseUrl}/search.json?${searchParams.toString()}`
  }

  // HTML検索URLの構築
  private buildHtmlSearchUrl(params: SearchParams): string {
    const searchParams = new URLSearchParams()

    if (params.query) {
      searchParams.append('q', params.query)
    }

    // ソート設定
    if (params.sortBy) {
      const sortValue = this.convertSortOption(params.sortBy)
      if (sortValue) {
        searchParams.append('sort_by', sortValue)
      }
    }

    // セット指定がある場合はコレクションURLを使用
    const collection = this.getCollectionFromSetCode(params.setCode)
    const baseUrl = collection ? `${this.baseUrl}${collection}` : `${this.baseUrl}/search`

    return `${baseUrl}?${searchParams.toString()}`
  }

  // セットコードからコレクションURLを取得
  private getCollectionFromSetCode(setCode?: string): string | null {
    if (!setCode) return null

    const setCode2 = setCode.toLowerCase()
    if (setCode2.startsWith('sv')) return this.collections.sv
    if (setCode2.startsWith('s')) return this.collections.swsh
    if (setCode2.startsWith('sm')) return this.collections.sm
    if (setCode2.startsWith('xy')) return this.collections.xy
    if (setCode2.startsWith('bw')) return this.collections.bw

    return null
  }

  // ソートオプションの変換
  private convertSortOption(sortBy: SortOption): string | null {
    const sortMap: Record<SortOption, string> = {
      [SortOption.PRICE_ASC]: 'price-ascending',
      [SortOption.PRICE_DESC]: 'price-descending',
      [SortOption.NAME_ASC]: 'title-ascending',
      [SortOption.NAME_DESC]: 'title-descending',
      [SortOption.NEWEST]: 'created-descending',
      [SortOption.POPULARITY]: 'best-selling',
    }
    return sortMap[sortBy] || null
  }

  // Shopify検索結果をShopCardに変換
  private convertShopifyResultToCard(item: ShopifySearchResponse['results'][0], index: number): ShopCard {
    const cardInfo = this.parseCardTitle(item.title)

    return {
      id: this.extractProductIdFromUrl(item.url) || `h2-api-${index}`,
      name: cardInfo.name,
      nameEn: cardInfo.nameEn,
      setName: cardInfo.setName,
      setCode: cardInfo.setCode,
      cardNumber: cardInfo.cardNumber,
      rarity: cardInfo.rarity,
      condition: CardCondition.NEAR_MINT,
      language: CardLanguage.JAPANESE,
      price: Math.round(item.price * 100), // Shopifyは小数で返すので100倍
      originalPrice: item.compare_at_price ? Math.round(item.compare_at_price * 100) : undefined,
      stockStatus: item.available ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK,
      imageUrl: item.image ? `https:${item.image}` : undefined,
      shopName: this.shopName,
      shopUrl: `${this.baseUrl}${item.url}`,
      lastUpdated: new Date(),
    }
  }

  // HTMLスクレイピング結果のパース
  private parseSearchResults(html: string): ShopCard[] {
    const $ = cheerio.load(html)
    const cards: ShopCard[] = []

    // Shopifyの商品グリッドを検索
    $('.grid-product, .product-item, .card-product, [data-product-id]').each((index: number, element: any) => {
      try {
        const card = this.parseProductElement($, element, index)
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
  private parseProductElement($: any, element: any, index: number): ShopCard | null {
    const $item = $(element)

    // タイトルの抽出
    const title = this.extractProductTitle($item)
    if (!title) return null

    // 価格の抽出
    const price = this.extractProductPrice($item)
    if (!price || price <= 0) return null

    // 商品URLの抽出
    const productUrl = this.extractProductUrl($item)
    const productId = this.extractProductIdFromUrl(productUrl) || `h2-${index}`

    // 画像URLの抽出
    const imageUrl = this.extractProductImage($item)

    // カード情報のパース
    const cardInfo = this.parseCardTitle(title)

    // 在庫状況の判定
    const stockStatus = this.extractStockStatus($item)

    return {
      id: productId,
      name: cardInfo.name,
      nameEn: cardInfo.nameEn,
      setName: cardInfo.setName,
      setCode: cardInfo.setCode,
      cardNumber: cardInfo.cardNumber,
      rarity: cardInfo.rarity,
      condition: CardCondition.NEAR_MINT,
      language: CardLanguage.JAPANESE,
      price: price,
      stockStatus: stockStatus,
      imageUrl: imageUrl,
      shopName: this.shopName,
      shopUrl: productUrl ? `${this.baseUrl}${productUrl}` : `${this.baseUrl}/products/${productId}`,
      lastUpdated: new Date(),
    }
  }

  // 商品タイトルの抽出
  private extractProductTitle($item: any): string | null {
    const selectors = [
      '.grid-product__title',
      '.product-title',
      '.card-product__title',
      'h3 a',
      'h4 a',
      '[data-product-title]',
      '.product-name'
    ]

    for (const selector of selectors) {
      const element = $item.find(selector).first()
      if (element.length > 0) {
        const title = element.text().trim() || element.attr('title')
        if (title && title.length > 0) {
          return title
        }
      }
    }

    return null
  }

  // 商品価格の抽出
  private extractProductPrice($item: any): number {
    const selectors = [
      '.grid-product__price',
      '.product-price',
      '.price',
      '[data-product-price]',
      '.money'
    ]

    for (const selector of selectors) {
      const element = $item.find(selector).first()
      if (element.length > 0) {
        const priceText = element.text().trim()
        const price = this.parsePriceString(priceText)
        if (price > 0) {
          return price
        }
      }
    }

    return 0
  }

  // 商品URLの抽出
  private extractProductUrl($item: any): string | null {
    const link = $item.find('a').first().attr('href')
    return link || null
  }

  // 商品画像の抽出
  private extractProductImage($item: any): string | undefined {
    const img = $item.find('img').first()
    if (img.length > 0) {
      let src = img.attr('data-src') || img.attr('src')
      if (src) {
        // Shopify CDN URLの正規化
        if (src.startsWith('//')) {
          src = `https:${src}`
        } else if (src.startsWith('/')) {
          src = `${this.baseUrl}${src}`
        }
        return src
      }
    }
    return undefined
  }

  // 在庫状況の抽出
  private extractStockStatus($item: any): StockStatus {
    const stockText = $item.find('.stock, .inventory, [data-stock]').text().toLowerCase()

    if (stockText.includes('売切') || stockText.includes('out') || $item.find('.sold-out').length > 0) {
      return StockStatus.OUT_OF_STOCK
    }

    if (stockText.includes('残り') || stockText.includes('few')) {
      return StockStatus.LOW_STOCK
    }

    return StockStatus.IN_STOCK
  }

  // 商品URLからIDを抽出
  private extractProductIdFromUrl(url: string | null): string | null {
    if (!url) return null

    // /products/product-handle 形式から handle を抽出
    const match = url.match(/\/products\/([^?\/]+)/)
    return match ? match[1] : null
  }

  // カードタイトルから情報を抽出
  private parseCardTitle(title: string): {
    name: string
    nameEn?: string
    setName?: string
    setCode?: string
    cardNumber?: string
    rarity?: string
  } {
    // 晴れる屋2のタイトル形式: "ポケモン名 [セットコード] ・レアリティ"
    const name = title.replace(/\s*\[.*?\]\s*・.*$/, '').trim()

    // セットコードの抽出
    const setMatch = title.match(/\[([^\]]+)\]/)
    const setCode = setMatch ? setMatch[1] : undefined

    // レアリティの抽出
    const rarityMatch = title.match(/・\s*([A-Z]+)$/)
    const rarity = rarityMatch ? rarityMatch[1] : undefined

    // カード番号の抽出（〈013/078〉形式）
    const numberMatch = title.match(/〈(\d+\/\d+)〉/)
    const cardNumber = numberMatch ? numberMatch[1] : undefined

    return {
      name,
      setCode,
      rarity,
      cardNumber,
    }
  }

  // 商品詳細ページのパース
  private parseProductDetail(html: string, cardId: string): ShopCard | null {
    const $ = cheerio.load(html)

    try {
      const title = $('.product-single__title, h1').first().text().trim()
      if (!title) return null

      const priceText = $('.product-single__price, .price').first().text().trim()
      const price = this.parsePriceString(priceText)
      if (!price) return null

      const cardInfo = this.parseCardTitle(title)

      return {
        id: cardId,
        name: cardInfo.name,
        nameEn: cardInfo.nameEn,
        setName: cardInfo.setName,
        setCode: cardInfo.setCode,
        cardNumber: cardInfo.cardNumber,
        rarity: cardInfo.rarity,
        price: price,
        stockStatus: StockStatus.IN_STOCK,
        language: CardLanguage.JAPANESE,
        shopName: this.shopName,
        shopUrl: `${this.baseUrl}/products/${cardId}`,
        lastUpdated: new Date(),
      }
    } catch (error) {
      this.log('Failed to parse product detail', error)
      return null
    }
  }
}