import { MarketCard, MarketStats } from '@/types/market'

export const mockMarketData: MarketCard[] = [
  {
    id: 'gym2-2',
    setId: 'gym2',
    number: '2',
    nameJp: 'ブレインのリザードン',
    nameEn: 'Blaine\'s Charizard',
    rarity: 'Rare Holo',
    imageUrl: 'https://images.pokemontcg.io/gym2/2_hires.png',
    releaseDate: new Date('2000-08-14'),
    createdAt: new Date(),
    updatedAt: new Date(),
    最低価格: 97500, // $650 × 150円
    市場変動24h: 15.2,
    市場変動7d: -8.7,
    出来高24h: 4500000,
    流通枚数: 200000,
    時価総額: 19500000000, // 97500 × 200000
    rank: 1,
  },
  {
    id: 'si1-1',
    setId: 'si1',
    number: '1',
    nameJp: 'ミュウ',
    nameEn: 'Mew',
    rarity: 'Rare',
    imageUrl: 'https://images.pokemontcg.io/si1/1_hires.png',
    releaseDate: new Date('2004-10-18'),
    createdAt: new Date(),
    updatedAt: new Date(),
    最低価格: 15000,
    市場変動24h: -3.8,
    市場変動7d: 12.4,
    出来高24h: 2800000,
    流通枚数: 2000000,
    時価総額: 30000000000, // 15000 × 2000000
    rank: 2,
  },
  {
    id: 'basep-1',
    setId: 'basep',
    number: '1',
    nameJp: 'ピカチュウ',
    nameEn: 'Pikachu',
    rarity: 'Promo',
    imageUrl: 'https://images.pokemontcg.io/basep/1_hires.png',
    releaseDate: new Date('1999-07-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    最低価格: 2530, // $16.87 × 150円
    市場変動24h: 2.1,
    市場変動7d: 5.8,
    出来高24h: 1200000,
    流通枚数: 10000000,
    時価総額: 25300000000, // 2530 × 10000000
    rank: 3,
  },
  {
    id: 'ru1-1',
    setId: 'ru1',
    number: '1',
    nameJp: 'フシギバナ',
    nameEn: 'Venusaur',
    rarity: 'Rare Holo',
    imageUrl: 'https://images.pokemontcg.io/ru1/1_hires.png',
    releaseDate: new Date('2022-02-25'),
    createdAt: new Date(),
    updatedAt: new Date(),
    最低価格: 8500,
    市場変動24h: -1.2,
    市場変動7d: -15.3,
    出来高24h: 890000,
    流通枚数: 800000,
    時価総額: 6800000000, // 8500 × 800000
    rank: 4,
  },
  {
    id: 'sm10-19',
    setId: 'sm10',
    number: '19',
    nameJp: 'カミツルギ',
    nameEn: 'Kartana',
    rarity: 'Rare',
    imageUrl: 'https://images.pokemontcg.io/sm10/19_hires.png',
    releaseDate: new Date('2019-02-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    最低価格: 4800,
    市場変動24h: 8.9,
    市場変動7d: 22.1,
    出来高24h: 650000,
    流通枚数: 950000,
    時価総額: 4560000000, // 4800 × 950000
    rank: 5,
  },
]

export const mockMarketStats: MarketStats = {
  総時価総額: 45200000000, // ¥45.2B
  取引高24h: 12800000,     // ¥12.8M  
  登録カード数: 2847,
  連携ショップ数: 67,
}