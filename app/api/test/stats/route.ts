import { NextResponse } from 'next/server'
import { realMarketService } from '@/lib/services/real-market-service'

export async function GET() {
  try {
    const stats = await realMarketService.getMarketStats()
    
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600'
      }
    })
  } catch (error) {
    console.error('Stats API エラー:', error)
    
    return NextResponse.json(
      { error: '統計データの取得に失敗しました' },
      { status: 500 }
    )
  }
}