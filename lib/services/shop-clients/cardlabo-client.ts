// カードラボ (Card Labo) HTMLスクレイピングクライアント

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

export class CardLaboClient extends BaseShopClient {
  private readonly pokemonPageUrl = '/page/125' // ポケモンカード専用ページ

  constructor() {
    super(
      'カードラボ',
      'https://www.c-labo-online.jp',
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
        totalCount: cards.length * 8, // 概算（正確な総数は取得困難）
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
    // カードラボでは商品IDから直接詳細ページにアクセス
    const detailUrl = `${this.baseUrl}/item/${cardId}`

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
      searchParams.append('keyword', params.query)
      searchParams.append('Submit', '') // カードラボの検索フォーム用
    }

    // ページネーション
    const page = params.page || 1
    if (page > 1) {
      // カードラボのページング形式に合わせる
      searchParams.append('page', page.toString())
    }

    // 1ページあたりの表示件数
    const limit = params.limit || 60 // カードラボのデフォルト表示数
    searchParams.append('num', limit.toString())

    // ソート（カードラボ固有の形式に変換）
    if (params.sortBy) {
      const sortValue = this.convertSortOption(params.sortBy)
      if (sortValue) {
        searchParams.append('sort', sortValue)
      }
    }

    // 価格範囲（もし対応している場合）
    if (params.minPrice) {
      searchParams.append('min_price', params.minPrice.toString())
    }
    if (params.maxPrice) {
      searchParams.append('max_price', params.maxPrice.toString())
    }

    // ポケモンカードページでの検索
    const baseUrl = `${this.baseUrl}${this.pokemonPageUrl}`
    const queryString = searchParams.toString()

    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }

  // ソートオプションの変換
  private convertSortOption(sortBy: SortOption): string | null {
    // カードラボのソートオプションに対応
    const sortMap: Record<SortOption, string> = {
      [SortOption.PRICE_ASC]: 'price_asc',
      [SortOption.PRICE_DESC]: 'price_desc',
      [SortOption.NAME_ASC]: 'name_asc',
      [SortOption.NAME_DESC]: 'name_desc',
      [SortOption.NEWEST]: 'date_desc',
      [SortOption.POPULARITY]: 'popular',
    }
    return sortMap[sortBy] || null
  }

  // 検索結果のHTMLパース
  private parseSearchResults(html: string, page: number): ShopCard[] {
    const $ = cheerio.load(html)
    const cards: ShopCard[] = []

    // カードラボの商品リストを抽出
    $('.ajax_itemlist_box .list_item_table, .item-box, .product-item, [data-item-id]').each((index: number, element: any) => {
      try {
        const card = this.parseProductElement($, element, page, index)
        if (card) {
          cards.push(card)
        }
      } catch (error) {
        this.log('Failed to parse product element', error)
      }
    })

    // 別のセレクターでも試行
    if (cards.length === 0) {
      $('.item, .product, .goods').each((index: number, element: any) => {
        try {
          const card = this.parseProductElement($, element, page, index)
          if (card) {
            cards.push(card)
          }
        } catch (error) {
          this.log('Failed to parse product element', error)
        }
      })
    }

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

    // 商品IDの抽出
    const productId = this.extractProductId($item) || `cl-${page}-${index}`

    // 画像URLの抽出
    const imageUrl = this.extractImageUrl($item)

    // 在庫情報の抽出
    const stockInfo = this.extractStockInfo($item)

    // カード情報のパース
    const cardInfo = this.parseCardInfo(name)

    // 商品URLの構築
    const productUrl = this.extractProductUrl($item)

    return {
      id: productId,
      name: name,
      nameEn: cardInfo.nameEn,
      setName: cardInfo.setName,
      setCode: cardInfo.setCode,
      cardNumber: cardInfo.cardNumber,
      rarity: cardInfo.rarity,
      condition: CardCondition.NEAR_MINT, // カードラボのデフォルト
      language: CardLanguage.JAPANESE,
      price: price,
      stock: stockInfo.quantity,
      stockStatus: stockInfo.status,
      imageUrl: imageUrl,
      shopName: this.shopName,
      shopUrl: productUrl ? `${this.baseUrl}${productUrl}` : `${this.baseUrl}/item/${productId}`,
      lastUpdated: new Date(),
    }
  }

  // カード名の抽出
  private extractCardName($item: any): string | null {
    const selectors = [
      '.item-name',
      '.product-name',
      '.itemname',
      '.goods-name',
      '.title',
      'h3',
      'h4',
      'a[title]',
      '.list_item_name'
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
      '.money',
      '[class*="price"]',
      '.list_item_price'
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
  private extractProductId($item: any): string | null {
    // data属性から抽出
    const dataId = $item.attr('data-item-id') || $item.attr('data-product-id')
    if (dataId) return dataId

    // リンクから抽出
    const link = $item.find('a').first().attr('href')
    if (link) {
      const match = link.match(/\/item\/([^\/\?]+)/)
      if (match) return match[1]
    }

    // フォーム内のhidden inputから抽出
    const hiddenInput = $item.find('input[name="goods_id"], input[name="item_id"]').first()
    if (hiddenInput.length > 0) {
      return hiddenInput.val()
    }

    return null
  }

  // 商品URLの抽出
  private extractProductUrl($item: any): string | null {
    const link = $item.find('a').first().attr('href')
    return link || null
  }

  // 画像URLの抽出
  private extractImageUrl($item: any): string | undefined {
    const img = $item.find('img').first()
    if (img.length > 0) {
      let src = img.attr('data-src') || img.attr('src')
      if (src) {
        // 相対URLを絶対URLに変換
        if (src.startsWith('/')) {
          src = `${this.baseUrl}${src}`
        }
        return src
      }
    }
    return undefined
  }

  // 在庫情報の抽出
  private extractStockInfo($item: any): { quantity?: number; status: StockStatus } {
    // 在庫表示テキストを検索
    const stockSelectors = [
      '.stock',
      '.zaiko',
      '.inventory',
      '[class*="stock"]',
      '.list_item_stock'
    ]

    for (const selector of stockSelectors) {
      const stockElement = $item.find(selector)
      if (stockElement.length > 0) {
        const stockText = stockElement.text().trim()
        return this.parseStockText(stockText)
      }
    }

    // 在庫表示が見つからない場合、売り切れボタンをチェック
    if ($item.find('.sold-out, .soldout, [disabled]').length > 0) {
      return { status: StockStatus.OUT_OF_STOCK }
    }

    // カートボタンがあれば在庫ありとみなす
    if ($item.find('.cart, .add-cart, input[type="submit"]').length > 0) {
      return { status: StockStatus.IN_STOCK }
    }

    // デフォルトは在庫ありとみなす
    return { status: StockStatus.IN_STOCK }
  }

  // 在庫テキストのパース
  private parseStockText(stockText: string): { quantity?: number; status: StockStatus } {
    if (stockText.includes('売切') || stockText.includes('在庫切れ') || stockText.includes('0個')) {
      return { status: StockStatus.OUT_OF_STOCK }
    }

    // 「在庫数 6個」のような形式から数値を抽出
    const quantityMatch = stockText.match(/(\d+)\s*個/)
    if (quantityMatch) {
      const quantity = parseInt(quantityMatch[1])
      if (quantity <= 3) {
        return { quantity, status: StockStatus.LOW_STOCK }
      } else {
        return { quantity, status: StockStatus.IN_STOCK }
      }
    }

    // 「残りわずか」などの表示
    if (stockText.includes('残り') || stockText.includes('わずか')) {
      return { status: StockStatus.LOW_STOCK }
    }

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
      { pattern: /SV1V|バイオレット/, setCode: 'sv1v', setName: 'バイオレットex' },
      { pattern: /SV1S|スカーレット/, setCode: 'sv1s', setName: 'スカーレットex' },
    ]

    for (const { pattern, setCode, setName } of setPatterns) {
      if (pattern.test(name)) {
        return { setCode, setName }
      }
    }

    // レアリティの抽出
    const rarityPatterns = [
      { pattern: /SR/, rarity: 'SR' },
      { pattern: /HR/, rarity: 'HR' },
      { pattern: /UR/, rarity: 'UR' },
      { pattern: /RR/, rarity: 'RR' },
      { pattern: /R\b/, rarity: 'R' },
      { pattern: /U\b/, rarity: 'U' },
      { pattern: /C\b/, rarity: 'C' },
    ]

    for (const { pattern, rarity } of rarityPatterns) {
      if (pattern.test(name)) {
        return { rarity }
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
      .replace(/^\s*・\s*/, '') // 先頭の・を削除
      .trim()
  }

  // カード詳細ページのパース
  private parseCardDetail(html: string, cardId: string): ShopCard | null {
    const $ = cheerio.load(html)

    try {
      // 詳細ページから情報を抽出
      const name = $('h1, .item-title, .product-name, .goods-name').first().text().trim()
      if (!name) return null

      const price = this.extractPrice($)
      if (!price) return null

      const cardInfo = this.parseCardInfo(name)
      const stockInfo = this.extractStockInfo($)

      return {
        id: cardId,
        name: this.cleanCardName(name),
        nameEn: cardInfo.nameEn,
        setName: cardInfo.setName,
        setCode: cardInfo.setCode,
        cardNumber: cardInfo.cardNumber,
        rarity: cardInfo.rarity,
        price: price,
        stock: stockInfo.quantity,
        stockStatus: stockInfo.status,
        language: CardLanguage.JAPANESE,
        shopName: this.shopName,
        shopUrl: `${this.baseUrl}/item/${cardId}`,
        lastUpdated: new Date(),
      }
    } catch (error) {
      this.log('Failed to parse card detail', error)
      return null
    }
  }
}