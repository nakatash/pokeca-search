// 価格収集Cronジョブエンドポイント
// Vercel Cronまたは外部スケジューラーから呼び出される

import { NextRequest, NextResponse } from 'next/server'
import { PriceCollectorWorker, getConfigFromEnv } from '@/workers/price-collector'
import { headers } from 'next/headers'

// Cronジョブの認証トークン（環境変数で設定）
const CRON_SECRET = process.env.CRON_SECRET

// ワーカーインスタンス（メモリ上に保持）
let worker: PriceCollectorWorker | null = null

export async function GET(request: NextRequest) {
  try {
    // 認証チェック（本番環境のみ）
    if (process.env.NODE_ENV === 'production') {
      const authHeader = headers().get('authorization')
      if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // ワーカーの初期化
    if (!worker) {
      const config = getConfigFromEnv()
      worker = new PriceCollectorWorker(config)
    }

    // 単発実行（Cronジョブとして呼ばれるため、定期実行は不要）
    console.log('価格収集Cronジョブを実行開始')
    await worker.run()

    return NextResponse.json({
      success: true,
      message: '価格収集が完了しました',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('価格収集Cronジョブエラー:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// 手動実行用のPOSTエンドポイント
export async function POST(request: NextRequest) {
  try {
    // 開発環境でのみ許可
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Not allowed in production' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (!worker) {
      const config = getConfigFromEnv()
      worker = new PriceCollectorWorker(config)
    }

    switch (action) {
      case 'start':
        await worker.start()
        return NextResponse.json({
          success: true,
          message: 'ワーカーを開始しました',
          status: worker.getStatus()
        })

      case 'stop':
        worker.stop()
        return NextResponse.json({
          success: true,
          message: 'ワーカーを停止しました',
          status: worker.getStatus()
        })

      case 'status':
        return NextResponse.json({
          success: true,
          status: worker.getStatus()
        })

      case 'run':
        await worker.run()
        return NextResponse.json({
          success: true,
          message: '単発実行が完了しました',
          status: worker.getStatus()
        })

      default:
        return NextResponse.json(
          { error: '無効なアクション' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('価格収集APIエラー:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}