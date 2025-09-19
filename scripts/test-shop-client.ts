// ショップクライアントのテストスクリプト
// 実行: npx tsx scripts/test-shop-client.ts

import { ShopClientFactory, ShopType, SortOption } from '@/lib/services/shop-clients'

async function testPokemonTCGClient() {
  console.log('🔍 Pokemon TCG APIクライアントのテスト開始\n')

  const client = ShopClientFactory.getClient(ShopType.POKEMON_TCG)

  try {
    // 1. カード検索テスト
    console.log('📋 テスト1: "リザードン"で検索')
    const searchResult = await client.searchCards({
      query: 'Charizard',
      limit: 5,
      sortBy: SortOption.PRICE_DESC,
    })

    console.log(`  検索結果: ${searchResult.totalCount}件`)
    console.log(`  取得件数: ${searchResult.cards.length}件`)
    console.log('  上位3件:')

    searchResult.cards.slice(0, 3).forEach((card, index) => {
      console.log(`    ${index + 1}. ${card.name}`)
      console.log(`       セット: ${card.setName} (#${card.cardNumber})`)
      console.log(`       レアリティ: ${card.rarity || '不明'}`)
      console.log(`       価格: ¥${card.price.toLocaleString()}`)
      console.log(`       画像: ${card.imageUrl}`)
      console.log()
    })

    // 2. カード詳細取得テスト
    if (searchResult.cards.length > 0) {
      const firstCard = searchResult.cards[0]
      console.log(`📋 テスト2: カード詳細取得 (ID: ${firstCard.id})`)

      const detail = await client.getCardDetail(firstCard.id)
      if (detail) {
        console.log(`  カード名: ${detail.name}`)
        console.log(`  価格: ¥${detail.price.toLocaleString()}`)
        console.log(`  在庫状態: ${detail.stockStatus}`)
        console.log(`  最終更新: ${detail.lastUpdated?.toLocaleString()}`)
      } else {
        console.log('  詳細情報の取得に失敗しました')
      }
    }

    console.log('\n✅ テスト完了')
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

async function testPriceSearch() {
  console.log('\n🔍 価格範囲検索のテスト\n')

  const client = ShopClientFactory.getClient(ShopType.POKEMON_TCG)

  try {
    console.log('📋 5,000円〜10,000円のカードを検索')
    const searchResult = await client.searchCards({
      query: 'ex',
      minPrice: 5000,
      maxPrice: 10000,
      limit: 5,
      sortBy: SortOption.PRICE_ASC,
    })

    console.log(`  検索結果: ${searchResult.totalCount}件`)
    searchResult.cards.forEach((card) => {
      console.log(`  - ${card.name}: ¥${card.price.toLocaleString()}`)
    })
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

async function testMultiplePages() {
  console.log('\n🔍 ページング処理のテスト\n')

  const client = ShopClientFactory.getClient(ShopType.POKEMON_TCG)

  try {
    // ページ1
    console.log('📋 ページ1を取得')
    const page1 = await client.searchCards({
      query: 'Pikachu',
      page: 1,
      limit: 3,
    })

    console.log(`  総件数: ${page1.totalCount}`)
    console.log(`  ページ1の件数: ${page1.cards.length}`)
    page1.cards.forEach((card) => console.log(`    - ${card.name}`))

    // ページ2
    if (page1.hasMore) {
      console.log('\n📋 ページ2を取得')
      const page2 = await client.searchCards({
        query: 'Pikachu',
        page: 2,
        limit: 3,
      })

      console.log(`  ページ2の件数: ${page2.cards.length}`)
      page2.cards.forEach((card) => console.log(`    - ${card.name}`))
    }
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// メイン実行
async function main() {
  console.log('============================================')
  console.log('    ショップクライアントテスト')
  console.log('============================================\n')

  // 基本的なテスト
  await testPokemonTCGClient()

  // 価格検索テスト
  await testPriceSearch()

  // ページングテスト
  await testMultiplePages()

  console.log('\n============================================')
  console.log('    すべてのテストが完了しました')
  console.log('============================================')
}

// エラーハンドリング付きで実行
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})