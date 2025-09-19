// カードラボクライアントのテストスクリプト
// 実行: npx tsx scripts/test-cardlabo-client.ts

import { ShopClientFactory, ShopType, SortOption } from '@/lib/services/shop-clients'

async function testCardLaboClient() {
  console.log('🔍 カードラボクライアントのテスト開始\n')

  try {
    const client = ShopClientFactory.getClient(ShopType.CARDLABO)

    // 1. 基本検索テスト (HTMLスクレイピング)
    console.log('📋 テスト1: 「ピカチュウ」でHTMLスクレイピング検索')
    try {
      const searchResult = await client.searchCards({
        query: 'ピカチュウ',
        limit: 5,
        sortBy: SortOption.PRICE_ASC,
      })

      console.log(`  検索結果: ${searchResult.totalCount}件（概算）`)
      console.log(`  取得件数: ${searchResult.cards.length}件`)

      if (searchResult.cards.length > 0) {
        console.log('  取得カード一覧:')
        searchResult.cards.forEach((card, index) => {
          console.log(`    ${index + 1}. ${card.name}`)
          console.log(`       セット: ${card.setCode || '不明'} - ${card.setName || '不明'}`)
          console.log(`       価格: ¥${card.price.toLocaleString()}`)
          console.log(`       在庫: ${card.stockStatus}`)
          console.log(`       URL: ${card.shopUrl}`)
          console.log()
        })

        // 2. カード詳細取得テスト
        const firstCard = searchResult.cards[0]
        console.log(`📋 テスト2: カード詳細取得 (ID: ${firstCard.id})`)

        const detail = await client.getCardDetail(firstCard.id)
        if (detail) {
          console.log(`  カード名: ${detail.name}`)
          console.log(`  価格: ¥${detail.price.toLocaleString()}`)
          console.log(`  在庫状態: ${detail.stockStatus}`)
          console.log(`  セット: ${detail.setCode || '不明'}`)
        } else {
          console.log('  詳細情報の取得に失敗しました')
        }
      } else {
        console.log('  ⚠️  検索結果が0件でした。HTMLセレクターの調整が必要な可能性があります。')
        await testAlternativeQueries(client)
      }
    } catch (error) {
      console.log(`  HTMLスクレイピング検索でエラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
      if (error instanceof Error && error.message.includes('cheerio')) {
        console.log('  💡 cheerioライブラリが見つかりません。以下のコマンドでインストールしてください:')
        console.log('     npm install cheerio @types/cheerio')
      }
    }

    console.log('\n✅ 基本テスト完了')
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)

    if (error instanceof Error) {
      if (error.message.includes('cheerio')) {
        console.log('\n💡 cheerioライブラリが見つかりません。以下のコマンドでインストールしてください:')
        console.log('   npm install cheerio @types/cheerio')
      } else if (error.message.includes('PARSER_UNAVAILABLE')) {
        console.log('\n💡 HTMLパーサーが利用できません。サーバーサイドで実行してください。')
      } else if (error.message.includes('RATE_LIMIT')) {
        console.log('\n💡 レート制限に達しました。しばらく待ってから再試行してください。')
      }
    }
  }
}

async function testAlternativeQueries(client: any) {
  console.log('\n📋 代替クエリでの検索テスト')

  const alternativeQueries = ['ex', 'vstar', 'リザードン']

  for (const query of alternativeQueries) {
    try {
      console.log(`  検索: ${query}`)
      const result = await client.searchCards({
        query,
        limit: 3,
      })

      console.log(`    結果: ${result.cards.length}件`)
      if (result.cards.length > 0) {
        result.cards.forEach((card, index) => {
          console.log(`      ${index + 1}. ${card.name} - ¥${card.price.toLocaleString()}`)
        })
      }

      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 3500))
    } catch (error) {
      console.log(`    エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }
}

async function testMultipleSearches() {
  console.log('\n🔍 複数検索テスト（カードラボサイト対応確認）\n')

  const client = ShopClientFactory.getClient(ShopType.CARDLABO)
  const testQueries = [
    { query: 'ex', limit: 3 },
    { query: 'vstar', limit: 3 },
    { query: 'リザードン', limit: 2 },
    { query: 'ポケモンカード', limit: 2 },
  ]

  for (const params of testQueries) {
    try {
      console.log(`📋 検索: ${params.query}`)
      const result = await client.searchCards(params)

      console.log(`  結果: ${result.cards.length}件`)
      if (result.cards.length > 0) {
        const prices = result.cards.map(c => c.price)
        console.log(`  価格範囲: ¥${Math.min(...prices).toLocaleString()} - ¥${Math.max(...prices).toLocaleString()}`)

        // 在庫状況の確認
        const stockStatusCounts = result.cards.reduce((acc, card) => {
          acc[card.stockStatus] = (acc[card.stockStatus] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        console.log(`  在庫状況: ${Object.entries(stockStatusCounts).map(([status, count]) => `${status}: ${count}件`).join(', ')}`)
      }
      console.log()

      // レート制限対策（カードラボは3秒間隔）
      await new Promise(resolve => setTimeout(resolve, 3500))
    } catch (error) {
      console.error(`  エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }
}

async function testScrapingFeatures() {
  console.log('\n🔍 スクレイピング固有機能テスト\n')

  const client = ShopClientFactory.getClient(ShopType.CARDLABO)

  try {
    // 価格フィルターのテスト
    console.log('📋 価格フィルターテスト（1000円〜5000円）')
    const priceFiltered = await client.searchCards({
      query: 'ピカチュウ',
      minPrice: 1000,
      maxPrice: 5000,
      limit: 3,
    })

    console.log(`  結果: ${priceFiltered.cards.length}件`)
    priceFiltered.cards.forEach(card => {
      const inRange = card.price >= 1000 && card.price <= 5000
      console.log(`    ${card.name}: ¥${card.price.toLocaleString()} ${inRange ? '✅' : '❌'}`)
    })

    // ソート機能のテスト
    console.log('\n📋 ソート機能テスト（価格降順）')
    const sorted = await client.searchCards({
      query: 'ex',
      sortBy: SortOption.PRICE_DESC,
      limit: 3,
    })

    console.log(`  結果: ${sorted.cards.length}件`)
    if (sorted.cards.length > 0) {
      const prices = sorted.cards.map(c => c.price)
      const isSorted = prices.every((price, i) => i === 0 || prices[i - 1] >= price)
      console.log(`  ソート確認: ${isSorted ? '✅ 正常' : '❌ 未ソート'}`)
      sorted.cards.forEach((card, i) => {
        console.log(`    ${i + 1}. ${card.name}: ¥${card.price.toLocaleString()}`)
      })
    }

    // セット情報の抽出テスト
    console.log('\n📋 セット情報抽出テスト')
    const setTest = await client.searchCards({
      query: 'SV4a',
      limit: 2,
    })

    console.log(`  結果: ${setTest.cards.length}件`)
    setTest.cards.forEach(card => {
      console.log(`    ${card.name}`)
      console.log(`      セット: ${card.setName || '未検出'} (${card.setCode || '未検出'})`)
      console.log(`      レアリティ: ${card.rarity || '未検出'}`)
    })

  } catch (error) {
    console.error(`  スクレイピング機能テストエラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
  }
}

// メイン実行
async function main() {
  console.log('============================================')
  console.log('    カードラボクライアントテスト')
  console.log('============================================\n')

  await testCardLaboClient()
  await testMultipleSearches()
  await testScrapingFeatures()

  console.log('\n============================================')
  console.log('    すべてのテストが完了しました')
  console.log('============================================')
  console.log('\n💡 注意事項:')
  console.log('- カードラボはHTMLスクレイピングのみ対応しています')
  console.log('- レート制限（3秒間隔）を遵守しています')
  console.log('- HTMLセレクターは変更される可能性があります')
  console.log('- 実際の商用利用前に、サイトの利用規約を確認してください')
  console.log('- cheerioライブラリが必要です: npm install cheerio @types/cheerio')
}

// エラーハンドリング付きで実行
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})