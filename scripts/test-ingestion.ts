// Ingestionサービスのテストスクリプト
// 実行: npx tsx scripts/test-ingestion.ts

import { CardIngestionService } from '@/lib/services/ingestion/card-ingestion.service'
import { ShopClientFactory, ShopType, StockStatus } from '@/lib/services/shop-clients'
import { testConnection } from '@/lib/db/client'

async function testIngestion() {
  console.log('========================================')
  console.log('  Ingestionサービステスト')
  console.log('========================================\n')

  // データベース接続テスト
  console.log('1. データベース接続テスト')
  const isConnected = await testConnection()
  if (!isConnected) {
    console.error('❌ データベースに接続できません')
    console.log('   PostgreSQLが起動していることを確認してください')
    return
  }
  console.log('✅ データベース接続成功\n')

  // Ingestionサービスのインスタンス化
  const ingestionService = new CardIngestionService()

  try {
    // 2. テスト用のカードデータ取得
    console.log('2. テスト用カードデータの取得')
    const client = ShopClientFactory.getClient(ShopType.POKEMON_TCG)
    const searchResult = await client.searchCards({
      query: 'Pikachu',
      limit: 3
    })

    console.log(`  取得件数: ${searchResult.cards.length}件`)
    searchResult.cards.forEach((card, index) => {
      console.log(`  ${index + 1}. ${card.name} (¥${card.price.toLocaleString()})`)
    })
    console.log()

    // 3. データベースへの保存テスト
    console.log('3. データベースへの保存')
    console.log('  バッチ保存を実行中...')

    const result = await ingestionService.ingestBatch(searchResult.cards)

    console.log('  保存結果:')
    console.log(`    成功: ${result.success}件`)
    console.log(`    失敗: ${result.failed}件`)

    if (result.errors.length > 0) {
      console.log('  エラー詳細:')
      result.errors.forEach(err => {
        console.log(`    - ${err.card}: ${err.error}`)
      })
    }
    console.log()

    // 4. スナップショット作成テスト
    if (result.success > 0 && searchResult.cards.length > 0) {
      console.log('4. 価格スナップショットの作成')
      const firstCard = searchResult.cards[0]
      const cardId = `${firstCard.setCode || 'unknown'}-${firstCard.cardNumber || firstCard.id}`.toLowerCase()

      await ingestionService.createPriceSnapshot(cardId)
      console.log(`  カードID「${cardId}」のスナップショットを作成しました`)
      console.log()
    }

    // 5. 重複チェックのテスト
    console.log('5. 重複チェックテスト')
    console.log('  同じデータで再度保存を実行...')

    const duplicateResult = await ingestionService.ingestBatch(searchResult.cards)
    console.log('  結果:')
    console.log(`    成功: ${duplicateResult.success}件`)
    console.log(`    失敗: ${duplicateResult.failed}件`)
    console.log('  （価格が変わっていない場合は新規レコードは作成されません）')

    console.log('\n✅ すべてのテストが完了しました')
  } catch (error) {
    console.error('\n❌ テスト中にエラーが発生しました:', error)
  }
}

async function testPriceUpdate() {
  console.log('\n========================================')
  console.log('  価格更新テスト')
  console.log('========================================\n')

  const ingestionService = new CardIngestionService()

  try {
    // 価格を変更したモックデータ
    const mockCard = {
      id: 'test-001',
      name: 'テストカード',
      nameEn: 'Test Card',
      setCode: 'test',
      setName: 'テストセット',
      cardNumber: '001',
      rarity: 'R',
      price: 1000 + Math.floor(Math.random() * 500), // ランダムな価格変動
      stock: 10,
      stockStatus: StockStatus.IN_STOCK,
      shopName: 'テストショップ',
      shopUrl: 'https://test.example.com/card/001',
      imageUrl: 'https://example.com/image.png',
      lastUpdated: new Date()
    }

    console.log(`テストカードの価格: ¥${mockCard.price}`)

    // 保存
    const result = await ingestionService.ingestBatch([mockCard])
    console.log(`保存結果: 成功=${result.success}, 失敗=${result.failed}`)

    // 2回目の保存（価格を変更）
    mockCard.price = mockCard.price + 200
    console.log(`価格を変更: ¥${mockCard.price}`)

    const updateResult = await ingestionService.ingestBatch([mockCard])
    console.log(`更新結果: 成功=${updateResult.success}, 失敗=${updateResult.failed}`)

    console.log('\n✅ 価格更新テストが完了しました')
  } catch (error) {
    console.error('❌ 価格更新テストでエラー:', error)
  }
}

// メイン実行
async function main() {
  try {
    await testIngestion()
    await testPriceUpdate()
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

main().catch(console.error)