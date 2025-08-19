import { TCGCard } from '@/types/pokemon-tcg-api'
import { MarketCard } from '@/types/market'

/**
 * Pokemon TCG APIのデータを内部形式に変換
 */
export function mapTCGCardToMarketCard(tcgCard: TCGCard, rank?: number): MarketCard {
  // 価格情報の取得（TCGPlayer優先、なければCardMarket）
  const tcgplayerPrice = tcgCard.tcgplayer?.prices?.normal?.market || 
                        tcgCard.tcgplayer?.prices?.holofoil?.market ||
                        tcgCard.tcgplayer?.prices?.reverseHolofoil?.market
  
  const cardmarketPrice = tcgCard.cardmarket?.prices?.trendPrice ||
                         tcgCard.cardmarket?.prices?.averageSellPrice

  // 価格をJPYに変換（仮の為替レート: 1USD = 150JPY, 1EUR = 165JPY）
  const priceUSD = tcgplayerPrice || 0
  const priceEUR = cardmarketPrice || 0
  const priceJPY = priceUSD > 0 ? Math.round(priceUSD * 150) : 
                   priceEUR > 0 ? Math.round(priceEUR * 165) : 1000

  // 流通枚数の推定（レアリティベース）
  const raritySupplyMap: Record<string, number> = {
    'Common': 2000000,
    'Uncommon': 800000,
    'Rare': 300000,
    'Rare Holo': 200000,
    'Ultra Rare': 100000,
    'Secret Rare': 50000,
    'Promo': 150000,
  }
  
  const estimatedSupply = raritySupplyMap[tcgCard.rarity || 'Common'] || 500000

  // 市場変動の推定（ランダム値で仮実装）
  const change24h = (Math.random() - 0.5) * 30 // -15% ~ +15%
  const change7d = (Math.random() - 0.5) * 50 // -25% ~ +25%

  return {
    id: tcgCard.id,
    setId: tcgCard.set.id,
    number: tcgCard.number,
    nameJp: tcgCard.name, // 本来は日本語名取得が必要
    nameEn: tcgCard.name,
    rarity: tcgCard.rarity || 'Unknown',
    imageUrl: tcgCard.images.large,
    releaseDate: new Date(tcgCard.set.releaseDate),
    circulationSupply: estimatedSupply,
    marketCapJpy: Math.round(priceJPY * estimatedSupply),
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // MarketCard特有のフィールド
    最低価格: priceJPY,
    市場変動24h: change24h,
    市場変動7d: change7d,
    出来高24h: Math.round(priceJPY * Math.random() * 1000), // 推定出来高
    流通枚数: estimatedSupply,
    時価総額: Math.round(priceJPY * estimatedSupply),
    rank: rank || 0,
  }
}

/**
 * 複数のTCGCardを一括変換
 */
export function mapTCGCardsToMarketCards(tcgCards: TCGCard[]): MarketCard[] {
  return tcgCards
    .filter(card => card.supertype === 'Pokémon') // ポケモンカードのみ
    .map((card, index) => mapTCGCardToMarketCard(card, index + 1))
    .sort((a, b) => b.時価総額 - a.時価総額) // 時価総額順にソート
    .map((card, index) => ({ ...card, rank: index + 1 })) // ランク再設定
}

/**
 * レアリティの日本語変換
 */
export function translateRarity(rarity: string): string {
  const rarityMap: Record<string, string> = {
    'Common': 'C',
    'Uncommon': 'UC', 
    'Rare': 'R',
    'Rare Holo': 'RR',
    'Ultra Rare': 'UR',
    'Secret Rare': 'SR',
    'Promo': 'PROMO',
    'Amazing Rare': 'AR',
    'Radiant Rare': 'K',
    'Classic Collection': 'CC',
  }
  
  return rarityMap[rarity] || rarity
}