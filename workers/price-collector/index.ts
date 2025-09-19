// 価格収集ワーカー
// 定期的に各ショップからカード価格を収集し、データベースに保存する

import { ShopClientFactory, ShopType, SortOption } from '@/lib/services/shop-clients'
import { CardIngestionService } from '@/lib/services/ingestion/card-ingestion.service'
import type { SearchParams, ShopCard } from '@/types/shop-client'

export interface WorkerConfig {
  // 実行間隔（分）
  intervalMinutes: number
  // 1回の実行で取得する最大カード数
  maxCardsPerRun: number
  // ショップごとの取得設定
  shopConfigs: {
    shopType: ShopType
    enabled: boolean
    queries: string[] // 検索クエリリスト
    maxPages: number // 最大ページ数
  }[]
}

export class PriceCollectorWorker {
  private ingestionService: CardIngestionService
  private config: WorkerConfig
  private isRunning: boolean = false
  private lastRunTime?: Date
  private intervalId?: NodeJS.Timeout

  constructor(config?: Partial<WorkerConfig>) {
    this.ingestionService = new CardIngestionService()
    this.config = {
      intervalMinutes: 1440, // デフォルト24時間間隔（1日）
      maxCardsPerRun: 2000, // 1日1回なのでより多くのカードを取得
      shopConfigs: [
        {
          shopType: ShopType.POKEMON_TCG,
          enabled: true,
          queries: ['Charizard', 'Pikachu', 'ex', 'vstar', 'vmax', 'Mew', 'Rayquaza', 'Lucario'],
          maxPages: 5 // より多くのページを取得
        },
        {
          shopType: ShopType.CARDRUSH,
          enabled: true,
          queries: ['リザードン', 'ピカチュウ', 'ex', 'vstar', 'vmax'],
          maxPages: 3 // カードラッシュは3ページまで
        },
        {
          shopType: ShopType.HARERUYA2,
          enabled: true,
          queries: ['リザードン', 'ピカチュウ', 'ex', 'vstar', 'vmax'],
          maxPages: 3 // 晴れる屋2は3ページまで
        },
        {
          shopType: ShopType.CARDLABO,
          enabled: true,
          queries: ['リザードン', 'ピカチュウ', 'ex', 'vstar', 'vmax'],
          maxPages: 3 // カードラボは3ページまで
        }
      ],
      ...config
    }
  }

  // ワーカーの開始
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('ワーカーは既に実行中です')
      return
    }

    console.log(`価格収集ワーカーを開始します（間隔: ${this.config.intervalMinutes}分 = ${Math.floor(this.config.intervalMinutes / 60)}時間）`)
    this.isRunning = true

    // 初回実行
    await this.run()

    // 定期実行の設定
    this.intervalId = setInterval(
      async () => {
        await this.run()
      },
      this.config.intervalMinutes * 60 * 1000
    )
  }

  // ワーカーの停止
  stop(): void {
    if (!this.isRunning) {
      console.log('ワーカーは実行されていません')
      return
    }

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    this.isRunning = false
    console.log('価格収集ワーカーを停止しました')
  }

  // メイン実行処理
  async run(): Promise<void> {
    const startTime = new Date()
    console.log(`[${startTime.toISOString()}] 価格収集を開始`)

    const allCards: ShopCard[] = []
    const errors: Array<{ shop: string; error: string }> = []

    // 各ショップから価格データを収集
    for (const shopConfig of this.config.shopConfigs) {
      if (!shopConfig.enabled) continue

      try {
        const cards = await this.collectFromShop(shopConfig)
        allCards.push(...cards)
        console.log(`  ${shopConfig.shopType}: ${cards.length}件取得`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '不明なエラー'
        errors.push({ shop: shopConfig.shopType, error: errorMsg })
        console.error(`  ${shopConfig.shopType}: エラー - ${errorMsg}`)
      }

      // ショップ間でのレート制限対策
      await this.sleep(2000)
    }

    // データベースに保存
    if (allCards.length > 0) {
      console.log(`データベースへの保存を開始（${allCards.length}件）`)
      const result = await this.ingestionService.ingestBatch(allCards)

      console.log(`保存完了:`)
      console.log(`  成功: ${result.success}件`)
      console.log(`  失敗: ${result.failed}件`)

      if (result.errors.length > 0) {
        console.log(`  エラー詳細:`)
        result.errors.slice(0, 5).forEach(err => {
          console.log(`    - ${err.card}: ${err.error}`)
        })
        if (result.errors.length > 5) {
          console.log(`    ... 他${result.errors.length - 5}件のエラー`)
        }
      }

      // スナップショットの作成
      await this.createSnapshots()
    }

    const endTime = new Date()
    const duration = (endTime.getTime() - startTime.getTime()) / 1000
    console.log(`[${endTime.toISOString()}] 価格収集完了（処理時間: ${duration}秒）`)

    this.lastRunTime = endTime

    // エラーサマリー
    if (errors.length > 0) {
      console.log('エラーが発生したショップ:')
      errors.forEach(err => {
        console.log(`  - ${err.shop}: ${err.error}`)
      })
    }
  }

  // 特定ショップからのデータ収集
  private async collectFromShop(config: WorkerConfig['shopConfigs'][0]): Promise<ShopCard[]> {
    const client = ShopClientFactory.getClient(config.shopType)
    const allCards: ShopCard[] = []

    for (const query of config.queries) {
      try {
        // 複数ページの取得
        for (let page = 1; page <= config.maxPages; page++) {
          const params: SearchParams = {
            query,
            page,
            limit: 20,
            sortBy: SortOption.NEWEST
          }

          const result = await client.searchCards(params)
          allCards.push(...result.cards)

          // 最大カード数に達した場合は終了
          if (allCards.length >= this.config.maxCardsPerRun) {
            return allCards.slice(0, this.config.maxCardsPerRun)
          }

          // 次のページがない場合は終了
          if (!result.hasMore) break

          // ページ間でのレート制限対策
          await this.sleep(1000)
        }
      } catch (error) {
        console.error(`クエリ「${query}」の取得中にエラー:`, error)
      }
    }

    return allCards
  }

  // スナップショットの作成
  private async createSnapshots(): Promise<void> {
    try {
      await this.ingestionService.createAllSnapshots()
      console.log('価格スナップショットを作成しました')
    } catch (error) {
      console.error('スナップショット作成エラー:', error)
    }
  }

  // スリープ処理
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ステータス取得
  getStatus(): {
    isRunning: boolean
    lastRunTime?: Date
    nextRunTime?: Date
    config: WorkerConfig
  } {
    const nextRunTime = this.lastRunTime
      ? new Date(this.lastRunTime.getTime() + this.config.intervalMinutes * 60 * 1000)
      : undefined

    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      nextRunTime,
      config: this.config
    }
  }
}

// シングルトンインスタンス
let workerInstance: PriceCollectorWorker | null = null

export function getPriceCollectorWorker(config?: Partial<WorkerConfig>): PriceCollectorWorker {
  if (!workerInstance) {
    workerInstance = new PriceCollectorWorker(config)
  }
  return workerInstance
}

// 環境変数から設定を読み込む
export function getConfigFromEnv(): Partial<WorkerConfig> {
  const shopConfigs: WorkerConfig['shopConfigs'] = []

  // Pokemon TCG API設定
  if (process.env.POKEMON_TCG_ENABLED !== 'false') {
    shopConfigs.push({
      shopType: ShopType.POKEMON_TCG,
      enabled: true,
      queries: (process.env.POKEMON_TCG_QUERIES || 'Charizard,Pikachu,ex,vstar,vmax,Mew,Rayquaza,Lucario').split(','),
      maxPages: parseInt(process.env.POKEMON_TCG_MAX_PAGES || '5')
    })
  }

  // カードラッシュ設定
  if (process.env.CARDRUSH_ENABLED !== 'false') {
    shopConfigs.push({
      shopType: ShopType.CARDRUSH,
      enabled: true,
      queries: (process.env.CARDRUSH_QUERIES || 'リザードン,ピカチュウ,ex,vstar,vmax').split(','),
      maxPages: parseInt(process.env.CARDRUSH_MAX_PAGES || '3')
    })
  }

  // 晴れる屋2設定
  if (process.env.HARERUYA2_ENABLED !== 'false') {
    shopConfigs.push({
      shopType: ShopType.HARERUYA2,
      enabled: true,
      queries: (process.env.HARERUYA2_QUERIES || 'リザードン,ピカチュウ,ex,vstar,vmax').split(','),
      maxPages: parseInt(process.env.HARERUYA2_MAX_PAGES || '3')
    })
  }

  // カードラボ設定
  if (process.env.CARDLABO_ENABLED !== 'false') {
    shopConfigs.push({
      shopType: ShopType.CARDLABO,
      enabled: true,
      queries: (process.env.CARDLABO_QUERIES || 'リザードン,ピカチュウ,ex,vstar,vmax').split(','),
      maxPages: parseInt(process.env.CARDLABO_MAX_PAGES || '3')
    })
  }

  return {
    intervalMinutes: parseInt(process.env.PRICE_COLLECTOR_INTERVAL || '1440'),
    maxCardsPerRun: parseInt(process.env.PRICE_COLLECTOR_MAX_CARDS || '2000'),
    shopConfigs
  }
}