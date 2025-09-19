// カードラッシュクライアントのテストスクリプト
// 実行: npx tsx scripts/test-cardrush-client.ts

import { ShopClientFactory, ShopType, SortOption } from '@/lib/services/shop-clients'

async function testCardRushClient() {
  console.log('🔍 カードラッシュクライアントのテスト開始\n')

  try {
    const client = ShopClientFactory.getClient(ShopType.CARDRUSH)

    // 1. 基本検索テスト
    console.log('📋 テスト1: 「ピカチュウ」で検索')
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
        console.log(`       価格: ¥${card.price.toLocaleString()}`)
        console.log(`       在庫: ${card.stockStatus}${card.stock ? ` (${card.stock}点)` : ''}`)
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
      } else {
        console.log('  詳細情報の取得に失敗しました（またはサイト構造が変更された可能性があります）')
      }
    } else {
      console.log('  ⚠️  検索結果が0件でした。サイト構造が変更された可能性があります。')
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

async function testSearchVariations() {
  console.log('\n🔍 検索バリエーションテスト\n')

  const client = ShopClientFactory.getClient(ShopType.CARDRUSH)
  const queries = ['リザードン', 'ex', 'vstar']

  for (const query of queries) {
    try {
      console.log(`📋 「${query}」で検索中...`)
      const result = await client.searchCards({
        query,
        limit: 3,
      })

      console.log(`  結果: ${result.cards.length}件`)
      if (result.cards.length > 0) {
        console.log(`  最安値: ¥${Math.min(...result.cards.map(c => c.price)).toLocaleString()}`)
        console.log(`  最高値: ¥${Math.max(...result.cards.map(c => c.price)).toLocaleString()}`)
      }
      console.log()

      // レート制限対策で待機
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`  エラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    }
  }
}

async function testErrorHandling() {
  console.log('\n🔍 エラーハンドリングテスト\n')

  const client = ShopClientFactory.getClient(ShopType.CARDRUSH)

  try {
    // 存在しないカードIDでの詳細取得
    console.log('📋 存在しないカードIDでの詳細取得テスト')
    const nonExistentCard = await client.getCardDetail('nonexistent-id-12345')

    if (nonExistentCard === null) {
      console.log('  ✅ 正しくnullが返されました')
    } else {
      console.log('  ⚠️  予期しない結果が返されました')
    }
  } catch (error) {
    console.log(`  エラーハンドリング確認: ${error instanceof Error ? error.message : '不明なエラー'}`)
  }
}

// メイン実行
async function main() {
  console.log('============================================')
  console.log('    カードラッシュクライアントテスト')
  console.log('============================================\n')

  await testCardRushClient()
  await testSearchVariations()
  await testErrorHandling()

  console.log('\n============================================')
  console.log('    すべてのテストが完了しました')
  console.log('============================================')
  console.log('\n💡 注意事項:')
  console.log('- HTMLスクレイピングはサイト構造の変更により動作しなくなる可能性があります')
  console.log('- レート制限を守るため、テスト間に適切な間隔を設けています')
  console.log('- 実際の商用利用前に、サイトの利用規約を確認してください')
}

// エラーハンドリング付きで実行
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})