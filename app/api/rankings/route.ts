import { NextRequest, NextResponse } from 'next/server'
import { RankingRepository } from '@/lib/db/repositories/rankings'
import { RankingType } from '@/types/database'

// モックデータ（データベース未接続の場合）
const mockRankingsData = {
  'spike_24h': [
    {
      ranking: {
        id: 1,
        cardId: 'sv4a-205',
        type: 'spike_24h' as RankingType,
        deltaPercent24h: 25.5,
        rank: 1,
        updatedAt: new Date(),
      },
      card: {
        id: 'sv4a-205',
        setId: 'sv4a',
        number: '205',
        nameJp: 'リザードンex',
        nameEn: 'Charizard ex',
        rarity: 'RR',
        imageUrl: 'https://images.pokemontcg.io/sv4a/205.png',
        releaseDate: new Date('2023-10-27'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      setInfo: {
        nameJp: 'シャイニートレジャーex',
        code: 'SV4a',
      },
      currentPrice: 16000,
    },
    {
      ranking: {
        id: 2,
        cardId: 'sv4a-190',
        type: 'spike_24h' as RankingType,
        deltaPercent24h: 18.3,
        rank: 2,
        updatedAt: new Date(),
      },
      card: {
        id: 'sv4a-190',
        setId: 'sv4a',
        number: '190',
        nameJp: 'ミュウex',
        nameEn: 'Mew ex',
        rarity: 'RR',
        imageUrl: 'https://images.pokemontcg.io/sv4a/190.png',
        releaseDate: new Date('2023-10-27'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      setInfo: {
        nameJp: 'シャイニートレジャーex',
        code: 'SV4a',
      },
      currentPrice: 10100,
    },
  ],
  'drop_24h': [
    {
      ranking: {
        id: 3,
        cardId: 'sv4a-025',
        type: 'drop_24h' as RankingType,
        deltaPercent24h: -12.5,
        rank: 1,
        updatedAt: new Date(),
      },
      card: {
        id: 'sv4a-025',
        setId: 'sv4a',
        number: '025',
        nameJp: 'ピカチュウ',
        nameEn: 'Pikachu',
        rarity: 'C',
        imageUrl: 'https://images.pokemontcg.io/sv4a/25.png',
        releaseDate: new Date('2023-10-27'),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      setInfo: {
        nameJp: 'シャイニートレジャーex',
        code: 'SV4a',
      },
      currentPrice: 350,
    },
  ],
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as RankingType || 'spike_24h'
    const limit = parseInt(searchParams.get('limit') || '50')

    // サポートされているランキングタイプをチェック
    const supportedTypes: RankingType[] = ['spike_24h', 'drop_24h', 'spike_7d', 'drop_7d', 'low_stock']
    if (!supportedTypes.includes(type)) {
      return NextResponse.json(
        { error: 'サポートされていないランキングタイプです' },
        { status: 400 }
      )
    }

    let rankings

    try {
      // データベースから取得を試行
      rankings = await RankingRepository.getRanking(type, limit)
    } catch (error) {
      console.log('データベース未接続、モックデータを使用:', error)
      // データベース接続に失敗した場合はモックデータを使用
      rankings = mockRankingsData[type] || []
    }

    return NextResponse.json({
      type,
      rankings,
      limit,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('ランキング取得エラー:', error)
    return NextResponse.json(
      { error: 'ランキングの取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

// ランキング更新エンドポイント（管理者用）
export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()

    if (type === 'all') {
      await RankingRepository.updateAllRankings()
      return NextResponse.json({ message: '全ランキングを更新しました' })
    } else if (type) {
      await RankingRepository.updateRankings(type as RankingType)
      return NextResponse.json({ message: `${type}ランキングを更新しました` })
    } else {
      return NextResponse.json(
        { error: 'ランキングタイプが指定されていません' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('ランキング更新エラー:', error)
    return NextResponse.json(
      { error: 'ランキングの更新中にエラーが発生しました' },
      { status: 500 }
    )
  }
}