// 晴れる屋2クライアントのテストスクリプト
// 実行: npx tsx scripts/test-hareruya2-client.ts

import { ShopClientFactory, ShopType, SortOption } from '@/lib/services/shop-clients'

async function testHareruya2Client() {
  console.log('🔍 晴れる屋2クライアントのテスト開始\n')

  try {
    const client = ShopClientFactory.getClient(ShopType.HARERUYA2)

    // 1. 基本検索テスト (Shopify API経由)
    console.log('📋 テスト1: 「ピカチュウ」でShopify API検索')
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
        console.log('  ⚠️  検索結果が0件でした。Shopify APIアクセスに問題がある可能性があります。')
        console.log('  HTMLスクレイピングでの検索を試行します...')
        await testHtmlScraping(client)
      }
    } catch (error) {
      console.log(`  Shopify API検索でエラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
      console.log('  HTMLスクレイピングでの検索を試行します...')
      await testHtmlScraping(client)
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

async function testHtmlScraping(client: any) {
  console.log('\n📋 HTMLスクレイピングでの検索テスト')

  try {
    // セット指定での検索（HTMLスクレイピング優先）
    const result = await client.searchCards({
      query: 'リザードン',
      setCode: 'sv', // Scarlet & Violet
      limit: 3,
    })

    console.log(`  結果: ${result.cards.length}件`)
    if (result.cards.length > 0) {
      result.cards.forEach((card, index) => {
        console.log(`    ${index + 1}. ${card.name} - ¥${card.price.toLocaleString()}`)
      })
    }
  } catch (error) {
    console.log(`  HTMLスクレイピングもエラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
  }
}

async function testMultipleSearches() {
  console.log('\n🔍 複数検索テスト（Shopifyベースサイト対応確認）\n')

  const client = ShopClientFactory.getClient(ShopType.HARERUYA2)
  const testQueries = [
    { query: 'ex', limit: 3 },
    { query: 'vstar', limit: 3 },
    { query: 'リザードン', setCode: 'sv', limit: 2 },
  ]

  for (const params of testQueries) {
    try {
      console.log(`📋 検索: ${params.query}${params.setCode ? ` (セット: ${params.setCode})` : ''}`)
      const result = await client.searchCards(params)

      console.log(`  結果: ${result.cards.length}件`)
      if (result.cards.length > 0) {
        const prices = result.cards.map(c => c.price)
        console.log(`  価格範囲: ¥${Math.min(...prices).toLocaleString()} - ¥${Math.max(...prices).toLocaleString()}`)
      }
      console.log()

      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 2500))
    } catch (error) {
      console.error(`  エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }
}

async function testShopifyFeatures() {
  console.log('\n🔍 Shopify固有機能テスト\n')

  const client = ShopClientFactory.getClient(ShopType.HARERUYA2)

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
    const prices = sorted.cards.map(c => c.price)
    const isSorted = prices.every((price, i) => i === 0 || prices[i - 1] >= price)
    console.log(`  ソート確認: ${isSorted ? '✅ 正常' : '❌ 未ソート'}`)

  } catch (error) {
    console.error(`  Shopify機能テストエラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
  }
}

// メイン実行
async function main() {
  console.log('============================================')
  console.log('    晴れる屋2クライアントテスト')
  console.log('============================================\n')

  await testHareruya2Client()
  await testMultipleSearches()
  await testShopifyFeatures()

  console.log('\n============================================')
  console.log('    すべてのテストが完了しました')
  console.log('============================================')
  console.log('\n💡 注意事項:')
  console.log('- 晴れる屋2はShopifyベースのため、API検索とHTMLスクレイピングの両方を試行します')
  console.log('- Shopify APIが利用できない場合は自動的にHTMLスクレイピングにフォールバックします')
  console.log('- 実際の商用利用前に、サイトの利用規約を確認してください')
  console.log('- レート制限（2秒間隔）を遵守しています')
}

// エラーハンドリング付きで実行
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})