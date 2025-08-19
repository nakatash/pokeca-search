// Pokemon TCG API用の型定義

export interface TCGCard {
  id: string
  name: string
  supertype: string
  subtypes: string[]
  level?: string
  hp?: string
  types?: string[]
  evolvesTo?: string[]
  attacks?: TCGAttack[]
  weaknesses?: TCGWeakness[]
  resistances?: TCGResistance[]
  retreatCost?: string[]
  convertedRetreatCost?: number
  set: TCGSet
  number: string
  artist?: string
  rarity?: string
  flavorText?: string
  nationalPokedexNumbers?: number[]
  legalities: Record<string, string>
  images: {
    small: string
    large: string
  }
  tcgplayer?: TCGPlayerPricing
  cardmarket?: CardMarketPricing
}

export interface TCGAttack {
  name: string
  cost?: string[]
  convertedEnergyCost?: number
  damage?: string
  text?: string
}

export interface TCGWeakness {
  type: string
  value: string
}

export interface TCGResistance {
  type: string
  value: string
}

export interface TCGSet {
  id: string
  name: string
  series: string
  printedTotal: number
  total: number
  legalities: Record<string, string>
  ptcgoCode?: string
  releaseDate: string
  updatedAt: string
  images: {
    symbol: string
    logo: string
  }
}

export interface TCGPlayerPricing {
  url: string
  updatedAt: string
  prices?: {
    normal?: PriceRange
    holofoil?: PriceRange
    reverseHolofoil?: PriceRange
  }
}

export interface CardMarketPricing {
  url: string
  updatedAt: string
  prices: {
    averageSellPrice?: number
    lowPrice?: number
    trendPrice?: number
    germanProLow?: number
    suggestedPrice?: number
    reverseHoloSell?: number
    reverseHoloLow?: number
    reverseHoloTrend?: number
    lowPriceExPlus?: number
    avg1?: number
    avg7?: number
    avg30?: number
    reverseHoloAvg1?: number
    reverseHoloAvg7?: number
    reverseHoloAvg30?: number
  }
}

export interface PriceRange {
  low?: number
  mid?: number
  high?: number
  market?: number
  directLow?: number
}

export interface TCGAPIResponse<T> {
  data: T[]
  page: number
  pageSize: number
  count: number
  totalCount: number
}

// 検索パラメータ
export interface TCGSearchParams {
  q?: string // クエリ文字列
  page?: number
  pageSize?: number
  orderBy?: string
  select?: string
}