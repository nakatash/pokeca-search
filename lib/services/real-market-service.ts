import { MarketCard, MarketStats } from '@/types/market'
import { pokemonTCGService } from './pokemon-tcg-service'
import { mapTCGCardsToMarketCards } from '@/lib/utils/tcg-data-mapper'
import { ServerError } from '@/lib/utils/error'

export interface RealMarketService {
  getMarketRanking(): Promise<MarketCard[]>
  getMarketStats(): Promise<MarketStats>
  searchCards(query: string): Promise<MarketCard[]>
  getPopularCards(): Promise<MarketCard[]>
}

class PokemonTCGMarketService implements RealMarketService {
  /**
   * 時価総額順のマーケットランキングを取得
   */
  async getMarketRanking(): Promise<MarketCard[]> {
    try {
      // 人気の高いカードを価格順で取得
      const popularCards = await pokemonTCGService.getPopularCards(20)
      const marketCards = mapTCGCardsToMarketCards(popularCards)
      
      return marketCards.slice(0, 10) // トップ10を返す
    } catch (error) {
      console.error('マーケットランキング取得エラー:', error)
      throw new ServerError('マーケットランキングの取得に失敗しました')
    }
  }

  /**
   * マーケット統計を取得
   */
  async getMarketStats(): Promise<MarketStats> {
    try {
      // 統計計算のため多めのデータを取得
      const cards = await pokemonTCGService.getPopularCards(100)
      const marketCards = mapTCGCardsToMarketCards(cards)
      
      const totalMarketCap = marketCards.reduce((sum, card) => sum + card.時価総額, 0)
      const totalVolume24h = marketCards.reduce((sum, card) => sum + card.出来高24h, 0)
      
      return {
        総時価総額: totalMarketCap,
        取引高24h: totalVolume24h,
        登録カード数: 15000, // Pokemon TCG APIの概算カード数
        連携ショップ数: 2, // TCGPlayer + CardMarket
      }
    } catch (error) {
      console.error('マーケット統計取得エラー:', error)
      
      // エラー時はデフォルト値を返す
      return {
        総時価総額: 45200000000,
        取引高24h: 12800000,
        登録カード数: 15000,
        連携ショップ数: 2,
      }
    }
  }

  /**
   * カードを検索
   */
  async searchCards(query: string): Promise<MarketCard[]> {
    try {
      const response = await pokemonTCGService.searchCardsByName(query, 1)
      const marketCards = mapTCGCardsToMarketCards(response.data)
      
      return marketCards
    } catch (error) {
      console.error('カード検索エラー:', error)
      throw new ServerError('カード検索に失敗しました')
    }
  }

  /**
   * 人気カードを取得
   */
  async getPopularCards(): Promise<MarketCard[]> {
    try {
      // 有名なポケモンのカードを取得
      const popularPokemon = ['pikachu', 'charizard', 'mew', 'lugia', 'rayquaza']
      const allCards: MarketCard[] = []
      
      for (const pokemon of popularPokemon) {
        const response = await pokemonTCGService.getCardsByPokemon(pokemon, 1)
        const marketCards = mapTCGCardsToMarketCards(response.data.slice(0, 3))
        allCards.push(...marketCards)
      }
      
      // 時価総額順にソートして上位15枚を返す
      return allCards
        .sort((a, b) => b.時価総額 - a.時価総額)
        .slice(0, 15)
        .map((card, index) => ({ ...card, rank: index + 1 }))
      
    } catch (error) {
      console.error('人気カード取得エラー:', error)
      throw new ServerError('人気カードの取得に失敗しました')
    }
  }
}

// 実データ用のマーケットサービス
export const realMarketService: RealMarketService = new PokemonTCGMarketService()

// 開発時の切り替え用
export const getMarketService = (): RealMarketService => {
  // 環境変数で実データ/モックデータを切り替え
  const useRealData = process.env.USE_REAL_DATA === 'true'
  
  if (useRealData) {
    return realMarketService
  } else {
    // モックサービスは既存のものを使用
    const { marketService } = require('./market-service')
    return marketService
  }
}