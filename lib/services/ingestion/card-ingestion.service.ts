// カードデータIngestionサービス
// 外部APIから取得したカードデータをデータベースに保存する

import { db } from '@/lib/db/client'
import { ShopCard } from '@/types/shop-client'
import { Card, CardSet, CardPrice } from '@/types/database'

export class CardIngestionService {
  // カードとセットのマスタデータを更新
  async upsertCardMaster(shopCard: ShopCard): Promise<string> {
    const client = await db.connect()

    try {
      await client.query('BEGIN')

      // セット情報のUPSERT（存在しない場合のみ作成）
      if (shopCard.setCode) {
        await client.query(
          `INSERT INTO sets (id, code, name_jp, name_en)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
             name_jp = COALESCE(EXCLUDED.name_jp, sets.name_jp),
             name_en = COALESCE(EXCLUDED.name_en, sets.name_en),
             updated_at = now()`,
          [
            shopCard.setCode,
            shopCard.setCode,
            shopCard.setName || shopCard.setCode,
            shopCard.setName
          ]
        )
      }

      // カード情報のUPSERT
      const cardId = this.generateCardId(shopCard)
      await client.query(
        `INSERT INTO cards (
          id, set_id, number, name_jp, name_en, rarity, image_url, release_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name_jp = COALESCE(EXCLUDED.name_jp, cards.name_jp),
          name_en = COALESCE(EXCLUDED.name_en, cards.name_en),
          rarity = COALESCE(EXCLUDED.rarity, cards.rarity),
          image_url = COALESCE(EXCLUDED.image_url, cards.image_url),
          updated_at = now()`,
        [
          cardId,
          shopCard.setCode,
          shopCard.cardNumber || '000',
          shopCard.name,
          shopCard.nameEn,
          shopCard.rarity,
          shopCard.imageUrl,
          shopCard.lastUpdated || new Date()
        ]
      )

      await client.query('COMMIT')
      return cardId
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('カードマスタ更新エラー:', error)
      throw error
    } finally {
      client.release()
    }
  }

  // ショップ情報のUPSERT
  async upsertShop(shopName: string, shopUrl: string): Promise<number> {
    const result = await db.query(
      `INSERT INTO shops (name, url)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET
         url = EXCLUDED.url,
         updated_at = now()
       RETURNING id`,
      [shopName, shopUrl]
    )

    return result.rows[0].id
  }

  // 価格データの保存（重複チェック付き）
  async savePriceData(shopCard: ShopCard, cardId: string, shopId: number): Promise<void> {
    // 既存の価格データをチェック
    const existingPrice = await db.query(
      `SELECT id, price_jpy, stock_qty, updated_at
       FROM card_prices
       WHERE card_id = $1 AND shop_id = $2 AND condition = $3
       ORDER BY created_at DESC
       LIMIT 1`,
      [cardId, shopId, shopCard.condition || 'NM']
    )

    const shouldInsert = this.shouldInsertPrice(existingPrice.rows[0], shopCard)

    if (shouldInsert) {
      // 新しい価格データを挿入
      await db.query(
        `INSERT INTO card_prices (
          card_id, shop_id, condition, price_jpy, shipping_jpy,
          stock_qty, url, collected_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          cardId,
          shopId,
          shopCard.condition || 'NM',
          shopCard.price,
          0, // 送料は別途計算が必要
          shopCard.stock || 1,
          shopCard.shopUrl,
          new Date()
        ]
      )
    } else {
      // 既存レコードの更新（最終確認時刻のみ）
      await db.query(
        `UPDATE card_prices
         SET updated_at = now(), collected_at = now()
         WHERE id = $1`,
        [existingPrice.rows[0].id]
      )
    }
  }

  // 価格データを挿入すべきか判定
  private shouldInsertPrice(existing: any, shopCard: ShopCard): boolean {
    if (!existing) return true

    // 価格が変わった場合
    if (existing.price_jpy !== shopCard.price) return true

    // 在庫数が大きく変わった場合（50%以上の変動）
    if (shopCard.stock && existing.stock_qty) {
      const stockChangeRate = Math.abs(shopCard.stock - existing.stock_qty) / existing.stock_qty
      if (stockChangeRate > 0.5) return true
    }

    // 最後の更新から1時間以上経過している場合
    const hoursSinceUpdate = (Date.now() - new Date(existing.updated_at).getTime()) / (1000 * 60 * 60)
    if (hoursSinceUpdate > 1) return true

    return false
  }

  // カードIDの生成（セットコード-カード番号）
  private generateCardId(shopCard: ShopCard): string {
    if (shopCard.id && shopCard.id.includes('-')) {
      return shopCard.id
    }

    const setCode = shopCard.setCode || 'unknown'
    const cardNumber = shopCard.cardNumber || shopCard.id || '000'
    return `${setCode}-${cardNumber}`.toLowerCase()
  }

  // バッチ処理用：複数カードの一括保存
  async ingestBatch(shopCards: ShopCard[]): Promise<{
    success: number
    failed: number
    errors: Array<{ card: string; error: string }>
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ card: string; error: string }>
    }

    // ショップ名でグループ化
    const cardsByShop = new Map<string, ShopCard[]>()
    for (const card of shopCards) {
      const shopName = card.shopName
      if (!cardsByShop.has(shopName)) {
        cardsByShop.set(shopName, [])
      }
      cardsByShop.get(shopName)!.push(card)
    }

    // ショップごとに処理
    for (const [shopName, cards] of cardsByShop) {
      try {
        // ショップ情報を取得/作成
        const shopId = await this.upsertShop(
          shopName,
          cards[0].shopUrl.split('/').slice(0, 3).join('/')
        )

        // カードごとに処理
        for (const card of cards) {
          try {
            // カードマスタの更新
            const cardId = await this.upsertCardMaster(card)

            // 価格データの保存
            await this.savePriceData(card, cardId, shopId)

            results.success++
          } catch (error) {
            results.failed++
            results.errors.push({
              card: card.name,
              error: error instanceof Error ? error.message : '不明なエラー'
            })
            console.error(`カード処理エラー (${card.name}):`, error)
          }
        }
      } catch (error) {
        results.failed += cards.length
        for (const card of cards) {
          results.errors.push({
            card: card.name,
            error: `ショップ処理エラー: ${error instanceof Error ? error.message : '不明なエラー'}`
          })
        }
        console.error(`ショップ処理エラー (${shopName}):`, error)
      }
    }

    return results
  }

  // 価格スナップショットの作成（1時間ごとの集計）
  async createPriceSnapshot(cardId: string): Promise<void> {
    const result = await db.query(
      `INSERT INTO price_snapshots (card_id, ts, min_jpy, median_jpy, max_jpy, shop_count)
       SELECT
         $1,
         date_trunc('hour', now()),
         MIN(price_jpy + shipping_jpy),
         PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_jpy + shipping_jpy),
         MAX(price_jpy + shipping_jpy),
         COUNT(DISTINCT shop_id)
       FROM card_prices
       WHERE card_id = $1
         AND stock_qty > 0
         AND collected_at >= date_trunc('hour', now())`,
      [cardId]
    )
  }

  // 全カードのスナップショット作成
  async createAllSnapshots(): Promise<void> {
    const cards = await db.query(
      `SELECT DISTINCT card_id
       FROM card_prices
       WHERE collected_at >= date_trunc('hour', now())`
    )

    for (const row of cards.rows) {
      try {
        await this.createPriceSnapshot(row.card_id)
      } catch (error) {
        console.error(`スナップショット作成エラー (${row.card_id}):`, error)
      }
    }
  }
}