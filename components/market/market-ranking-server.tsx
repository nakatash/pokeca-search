import { marketService } from '@/lib/services/market-service'
import { MarketRankingTable } from './market-ranking-table'

export async function MarketRankingServer() {
  const cards = await marketService.getMarketRanking()
  return <MarketRankingTable cards={cards} />
}