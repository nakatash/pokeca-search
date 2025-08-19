import { marketService } from '@/lib/services/market-service'
import { MarketStatsSection } from './market-stats'

export async function MarketStatsServer() {
  const stats = await marketService.getMarketStats()
  return <MarketStatsSection stats={stats} />
}