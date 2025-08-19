// データベーステーブルの型定義

// ショップ
export interface Shop {
  id: number
  name: string
  url: string
  isVerified: boolean
  affiliateProgram?: string
  affiliateId?: string
  shippingPolicy?: Record<string, any>
  returnPolicy?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// セット（シリーズ）
export interface CardSet {
  id: string
  code: string
  nameJp: string
  nameEn?: string
  releaseDate?: Date
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}

// カード
export interface Card {
  id: string
  setId: string
  number: string
  nameJp: string
  nameEn?: string
  rarity?: string
  imageUrl?: string
  releaseDate?: Date
  circulationSupply?: number  // 流通枚数
  marketCapJpy?: number      // 時価総額（円）
  createdAt: Date
  updatedAt: Date
}

// カードの状態
export type CardCondition = 'NM' | 'LP' | 'MP' | 'HP'

// 鑑定機関
export type GradeType = 'PSA' | 'BGS'

// カード価格
export interface CardPrice {
  id: number
  cardId: string
  shopId: number
  condition: CardCondition
  gradeType?: GradeType
  gradeValue?: string
  priceJpy: number
  shippingJpy: number
  stockQty: number
  etaDays?: number
  url: string
  collectedAt: Date
  createdAt: Date
  updatedAt: Date
}

// 価格スナップショット
export interface PriceSnapshot {
  id: number
  cardId: string
  ts: Date
  minJpy?: number
  medianJpy?: number
  maxJpy?: number
  shopCount?: number
  createdAt: Date
}

// ユーザー
export interface User {
  id: string
  email?: string
  passwordHash?: string
  lineUid?: string
  createdAt: Date
  updatedAt: Date
}

// お気に入り
export interface Favorite {
  userId: string
  cardId: string
  createdAt: Date
}

// アラート方向
export type AlertDirection = 'up' | 'down'

// 通知チャンネル
export type AlertChannel = 'email' | 'line'

// アラート
export interface Alert {
  id: string
  userId: string
  cardId: string
  thresholdJpy: number
  direction: AlertDirection
  channel: AlertChannel
  isActive: boolean
  lastTriggeredAt?: Date
  createdAt: Date
  updatedAt: Date
}

// ブログ記事
export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt?: string
  body: string
  authorId?: string
  publishedAt?: Date
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

// ランキングタイプ
export type RankingType = 'spike_24h' | 'drop_24h' | 'spike_7d' | 'drop_7d' | 'low_stock'

// ランキング
export interface Ranking {
  id: number
  cardId: string
  type: RankingType
  deltaPercent24h?: number
  deltaPercent7d?: number
  rank: number
  updatedAt: Date
}

// 価格比較用の拡張型
export interface CardPriceWithShop extends CardPrice {
  shop: Shop
  総コスト: number // priceJpy + shippingJpy
}

// カード詳細表示用の拡張型
export interface CardWithPrices extends Card {
  set: CardSet
  prices: CardPriceWithShop[]
  snapshot?: PriceSnapshot
}