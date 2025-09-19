// ショップAPIクライアントの共通型定義

// カード情報
export interface ShopCard {
  // 基本情報
  id: string // ショップ内の商品ID
  name: string // カード名（日本語）
  nameEn?: string // カード名（英語）

  // セット情報
  setName?: string // セット名
  setCode?: string // セットコード
  cardNumber?: string // カード番号

  // カード詳細
  rarity?: string // レアリティ
  condition?: CardCondition // カードの状態
  language?: CardLanguage // 言語

  // 価格情報
  price: number // 価格（円）
  originalPrice?: number // 定価・元価格
  discountRate?: number // 割引率

  // 在庫情報
  stock?: number // 在庫数
  stockStatus?: StockStatus // 在庫状態

  // 画像
  imageUrl?: string // カード画像URL
  thumbnailUrl?: string // サムネイル画像URL

  // ショップ情報
  shopName: string // ショップ名
  shopUrl: string // 商品ページURL

  // 日時
  lastUpdated?: Date // 最終更新日時
}

// カードの状態
export enum CardCondition {
  MINT = 'mint', // 完美品
  NEAR_MINT = 'near_mint', // 極美品
  EXCELLENT = 'excellent', // 美品
  GOOD = 'good', // 良品
  PLAYED = 'played', // プレイ用
  DAMAGED = 'damaged', // 傷あり
}

// カードの言語
export enum CardLanguage {
  JAPANESE = 'ja',
  ENGLISH = 'en',
  CHINESE = 'zh',
  KOREAN = 'ko',
}

// 在庫状態
export enum StockStatus {
  IN_STOCK = 'in_stock', // 在庫あり
  LOW_STOCK = 'low_stock', // 残りわずか
  OUT_OF_STOCK = 'out_of_stock', // 在庫切れ
  PRE_ORDER = 'pre_order', // 予約受付中
}

// 検索パラメータ
export interface SearchParams {
  query: string // 検索クエリ
  setCode?: string // セットコード
  minPrice?: number // 最低価格
  maxPrice?: number // 最高価格
  condition?: CardCondition // カードの状態
  language?: CardLanguage // 言語
  sortBy?: SortOption // ソート順
  page?: number // ページ番号
  limit?: number // 取得件数
}

// ソートオプション
export enum SortOption {
  PRICE_ASC = 'price_asc', // 価格の昇順
  PRICE_DESC = 'price_desc', // 価格の降順
  NAME_ASC = 'name_asc', // 名前の昇順
  NAME_DESC = 'name_desc', // 名前の降順
  NEWEST = 'newest', // 新着順
  POPULARITY = 'popularity', // 人気順
}

// 検索結果
export interface SearchResult {
  cards: ShopCard[] // カードリスト
  totalCount: number // 総件数
  page: number // 現在のページ
  limit: number // 1ページあたりの件数
  hasMore: boolean // 次のページがあるか
}

// ショップクライアントインターフェース
export interface IShopClient {
  // ショップ情報
  readonly shopName: string
  readonly shopUrl: string
  readonly supportsApi: boolean

  // カード検索
  searchCards(params: SearchParams): Promise<SearchResult>

  // カード詳細取得
  getCardDetail(cardId: string): Promise<ShopCard | null>

  // 価格更新チェック
  checkPriceUpdate(cardIds: string[]): Promise<ShopCard[]>
}

// エラー型
export class ShopClientError extends Error {
  constructor(
    message: string,
    public readonly shopName: string,
    public readonly code?: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'ShopClientError'
  }
}

// レート制限エラー
export class RateLimitError extends ShopClientError {
  constructor(
    shopName: string,
    public readonly retryAfter?: number // 再試行までの秒数
  ) {
    super('Rate limit exceeded', shopName, 'RATE_LIMIT', 429)
    this.name = 'RateLimitError'
  }
}