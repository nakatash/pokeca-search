// 価格収集ワーカーのテストスクリプト
// 実行: npx tsx scripts/test-worker.ts

import { PriceCollectorWorker } from '@/workers/price-collector'
import { ShopType } from '@/lib/services/shop-clients'
import { testConnection } from '@/lib/db/client'

async function testWorker() {
  console.log('========================================')
  console.log('  価格収集ワーカーテスト')
  console.log('========================================\n')

  // データベース接続確認
  const isConnected = await testConnection()
  if (!isConnected) {
    console.error('❌ データベースに接続できません')
    return
  }

  // テスト用の設定（少量のデータで高速実行）
  const testConfig = {
    intervalMinutes: 1, // 1分間隔（テスト用）
    maxCardsPerRun: 10, // 最大10件
    shopConfigs: [
      {
        shopType: ShopType.POKEMON_TCG,
        enabled: true,
        queries: ['Pikachu', 'Charizard'], // 2つのクエリのみ
        maxPages: 1 // 1ページのみ
      }
    ]
  }

  const worker = new PriceCollectorWorker(testConfig)

  try {
    // 1. 単発実行テスト
    console.log('1. 単発実行テスト')
    console.log('  ワーカーを1回実行します...\n')

    await worker.run()

    console.log('\n✅ 単発実行が完了しました\n')

    // 2. ステータス確認
    console.log('2. ワーカーステータス')
    const status = worker.getStatus()
    console.log('  実行中:', status.isRunning)
    console.log('  最終実行時刻:', status.lastRunTime?.toLocaleString() || '未実行')
    console.log('  設定:')
    console.log('    実行間隔:', status.config.intervalMinutes, '分')
    console.log('    最大取得数:', status.config.maxCardsPerRun, '件')
    console.log()

    // 3. 定期実行テスト（短時間）
    console.log('3. 定期実行テスト（10秒間）')
    console.log('  ワーカーを開始します...')

    await worker.start()

    // 10秒間待機
    await new Promise(resolve => setTimeout(resolve, 10000))

    console.log('  ワーカーを停止します...')
    worker.stop()

    console.log('\n✅ 定期実行テストが完了しました')
  } catch (error) {
    console.error('❌ ワーカーテストでエラー:', error)
  }
}

async function testWorkerError() {
  console.log('\n========================================')
  console.log('  エラーハンドリングテスト')
  console.log('========================================\n')

  // 不正な設定でワーカーを作成
  const errorConfig = {
    intervalMinutes: 1,
    maxCardsPerRun: 5,
    shopConfigs: [
      {
        shopType: ShopType.POKEMON_TCG,
        enabled: true,
        queries: ['InvalidQuery#$%'], // 特殊文字を含むクエリ
        maxPages: 1
      }
    ]
  }

  const worker = new PriceCollectorWorker(errorConfig)

  try {
    console.log('不正なクエリでの実行テスト...')
    await worker.run()
    console.log('✅ エラーハンドリングが正常に動作しました')
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// コマンドライン引数の処理
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'run':
      // 単発実行
      console.log('単発実行モード\n')
      const worker = new PriceCollectorWorker()
      await worker.run()
      break

    case 'start':
      // 継続実行（Ctrl+Cで停止）
      console.log('継続実行モード（Ctrl+Cで停止）\n')
      const continuousWorker = new PriceCollectorWorker()
      await continuousWorker.start()

      // プロセス終了時の処理
      process.on('SIGINT', () => {
        console.log('\n停止シグナルを受信しました')
        continuousWorker.stop()
        process.exit(0)
      })
      break

    case 'test':
    default:
      // テスト実行
      await testWorker()
      await testWorkerError()
      break
  }
}

// ヘルプメッセージ
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
使用方法:
  npx tsx scripts/test-worker.ts [command]

コマンド:
  test    - テストを実行（デフォルト）
  run     - ワーカーを1回実行
  start   - ワーカーを継続実行（Ctrl+Cで停止）
  --help  - このヘルプを表示
  `)
  process.exit(0)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})