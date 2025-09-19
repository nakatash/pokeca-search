// ショップクライアント基底クラス

import {
  IShopClient,
  SearchParams,
  SearchResult,
  ShopCard,
  ShopClientError,
  RateLimitError,
} from '@/types/shop-client'

export abstract class BaseShopClient implements IShopClient {
  protected readonly baseUrl: string
  protected readonly headers: Record<string, string>
  protected requestCount = 0
  protected lastRequestTime = 0

  constructor(
    public readonly shopName: string,
    public readonly shopUrl: string,
    public readonly supportsApi: boolean = false,
    protected readonly rateLimit: {
      maxRequests: number // 最大リクエスト数
      perSeconds: number // 期間（秒）
    } = { maxRequests: 10, perSeconds: 1 }
  ) {
    this.baseUrl = shopUrl
    this.headers = {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    }
  }

  // レート制限チェック
  protected async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    // 期間がリセットされた場合
    if (timeSinceLastRequest > this.rateLimit.perSeconds * 1000) {
      this.requestCount = 0
    }

    // レート制限に達した場合
    if (this.requestCount >= this.rateLimit.maxRequests) {
      const waitTime = this.rateLimit.perSeconds * 1000 - timeSinceLastRequest
      if (waitTime > 0) {
        throw new RateLimitError(
          this.shopName,
          Math.ceil(waitTime / 1000)
        )
      }
      this.requestCount = 0
    }

    this.requestCount++
    this.lastRequestTime = now
  }

  // HTTPリクエスト共通処理
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<Response> {
    await this.checkRateLimit()

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
        ...(options.headers as Record<string, string>),
      },
    }

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, requestOptions)

        // レート制限エラー
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          throw new RateLimitError(
            this.shopName,
            retryAfter ? parseInt(retryAfter) : 60
          )
        }

        // その他のエラー
        if (!response.ok) {
          throw new ShopClientError(
            `HTTP ${response.status}: ${response.statusText}`,
            this.shopName,
            'HTTP_ERROR',
            response.status
          )
        }

        return response
      } catch (error) {
        // 最後の試行でもエラーの場合
        if (i === retries - 1) {
          if (error instanceof ShopClientError) {
            throw error
          }
          throw new ShopClientError(
            `Failed to fetch from ${this.shopName}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            this.shopName,
            'FETCH_ERROR'
          )
        }

        // リトライ前に待機
        await this.sleep(Math.pow(2, i) * 1000)
      }
    }

    throw new ShopClientError(
      `Max retries exceeded for ${this.shopName}`,
      this.shopName,
      'MAX_RETRIES'
    )
  }

  // スリープ処理
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // 価格文字列を数値に変換
  protected parsePriceString(priceStr: string): number {
    // 全角数字を半角に変換
    const halfWidthStr = priceStr.replace(/[０-９]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    })

    // カンマ、円マークなどを除去
    const cleanStr = halfWidthStr.replace(/[,，、¥￥円]/g, '')

    // 数字のみを抽出
    const match = cleanStr.match(/\d+/)
    return match ? parseInt(match[0]) : 0
  }

  // 在庫数文字列を数値に変換
  protected parseStockString(stockStr: string): number | undefined {
    if (!stockStr) return undefined

    const cleanStr = stockStr.replace(/[^0-9]/g, '')
    if (!cleanStr) return undefined

    const stock = parseInt(cleanStr)
    return isNaN(stock) ? undefined : stock
  }

  // 抽象メソッド
  abstract searchCards(params: SearchParams): Promise<SearchResult>
  abstract getCardDetail(cardId: string): Promise<ShopCard | null>

  // 価格更新チェック（デフォルト実装）
  async checkPriceUpdate(cardIds: string[]): Promise<ShopCard[]> {
    const results: ShopCard[] = []

    for (const cardId of cardIds) {
      try {
        const card = await this.getCardDetail(cardId)
        if (card) {
          results.push(card)
        }
      } catch (error) {
        console.error(`Failed to check price for ${cardId}:`, error)
      }
    }

    return results
  }

  // デバッグ用
  protected log(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.shopName}] ${message}`, data || '')
    }
  }
}