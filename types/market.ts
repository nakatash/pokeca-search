import { Card } from './database'

export interface MarketData {
  最低価格: number
  市場変動24h: number
  市場変動7d: number
  出来高24h: number
  流通枚数: number
  時価総額: number
  rank: number
}

export interface MarketCard extends Card, MarketData {}

export interface MarketStats {
  総時価総額: number
  取引高24h: number
  登録カード数: number
  連携ショップ数: number
}