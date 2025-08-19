import { NextResponse } from 'next/server'
import { realMarketService } from '@/lib/services/real-market-service'

export async function GET() {
  try {
    const cards = await realMarketService.getMarketRanking()
    
    return NextResponse.json(cards, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    })
  } catch (error) {
    console.error('Cards API エラー:', error)
    
    return NextResponse.json(
      { error: 'カードデータの取得に失敗しました' },
      { status: 500 }
    )
  }
}