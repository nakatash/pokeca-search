import { MarketCard, MarketStats } from '@/types/market'
import { mockMarketData, mockMarketStats } from '@/lib/data/mock-market'
import { ServerError } from '@/lib/utils/error'

export interface MarketService {
  getMarketRanking(): Promise<MarketCard[]>
  getMarketStats(): Promise<MarketStats>
}

class MockMarketService implements MarketService {
  async getMarketRanking(): Promise<MarketCard[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      return mockMarketData
    } catch (error) {
      throw new ServerError('マーケットランキングの取得に失敗しました')
    }
  }

  async getMarketStats(): Promise<MarketStats> {
    try {
      await new Promise(resolve => setTimeout(resolve, 50))
      return mockMarketStats
    } catch (error) {
      throw new ServerError('マーケット統計の取得に失敗しました')
    }
  }
}

export const marketService: MarketService = new MockMarketService()