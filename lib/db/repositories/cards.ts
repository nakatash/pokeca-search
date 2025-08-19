import { db } from '../client'
import { Card, CardWithPrices, CardPriceWithShop } from '@/types/database'

export class CardRepository {
  // カード検索
  static async search(params: {
    query?: string
    setId?: string
    rarity?: string
    limit?: number
    offset?: number
  }) {
    const { query, setId, rarity, limit = 20, offset = 0 } = params

    let whereConditions = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (query) {
      whereConditions.push(`(c.name_jp ILIKE $${paramIndex} OR c.name_en ILIKE $${paramIndex + 1} OR c.number ILIKE $${paramIndex + 2})`)
      const likeQuery = `%${query}%`
      queryParams.push(likeQuery, likeQuery, `%${query}%`)
      paramIndex += 3
    }

    if (setId) {
      whereConditions.push(`c.set_id = $${paramIndex}`)
      queryParams.push(setId)
      paramIndex++
    }

    if (rarity) {
      whereConditions.push(`c.rarity = $${paramIndex}`)
      queryParams.push(rarity)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const countQuery = `
      SELECT COUNT(*) as count
      FROM cards c
      ${whereClause}
    `

    const searchQuery = `
      SELECT c.*, s.name_jp as set_name_jp, s.name_en as set_name_en
      FROM cards c
      LEFT JOIN sets s ON c.set_id = s.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    try {
      const [countResult, cardsResult] = await Promise.all([
        db.query(countQuery, queryParams),
        db.query(searchQuery, [...queryParams, limit, offset])
      ])

      return {
        cards: cardsResult.rows as Card[],
        totalCount: parseInt(countResult.rows[0].count),
        limit,
        offset
      }
    } catch (error) {
      console.error('カード検索エラー:', error)
      throw new Error('カードの検索に失敗しました')
    }
  }

  // カード詳細取得（価格情報付き）
  static async getWithPrices(cardId: string): Promise<CardWithPrices | null> {
    try {
      const cardQuery = `
        SELECT c.*, s.*
        FROM cards c
        LEFT JOIN sets s ON c.set_id = s.id
        WHERE c.id = $1
      `

      const pricesQuery = `
        SELECT cp.*, sh.*
        FROM card_prices cp
        LEFT JOIN shops sh ON cp.shop_id = sh.id
        WHERE cp.card_id = $1 AND cp.stock_qty > 0
        ORDER BY (cp.price_jpy + cp.shipping_jpy) ASC
      `

      const snapshotQuery = `
        SELECT *
        FROM price_snapshots
        WHERE card_id = $1
        ORDER BY ts DESC
        LIMIT 1
      `

      const [cardResult, pricesResult, snapshotResult] = await Promise.all([
        db.query(cardQuery, [cardId]),
        db.query(pricesQuery, [cardId]),
        db.query(snapshotQuery, [cardId])
      ])

      if (cardResult.rows.length === 0) {
        return null
      }

      const cardData = cardResult.rows[0]
      const prices: CardPriceWithShop[] = pricesResult.rows.map((row: any) => ({
        ...row,
        shop: {
          id: row.shop_id,
          name: row.name,
          url: row.url,
          isVerified: row.is_verified,
          affiliateProgram: row.affiliate_program,
          affiliateId: row.affiliate_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        総コスト: row.price_jpy + row.shipping_jpy
      }))

      return {
        id: cardData.id,
        setId: cardData.set_id,
        number: cardData.number,
        nameJp: cardData.name_jp,
        nameEn: cardData.name_en,
        rarity: cardData.rarity,
        imageUrl: cardData.image_url,
        releaseDate: cardData.release_date,
        createdAt: cardData.created_at,
        updatedAt: cardData.updated_at,
        set: {
          id: cardData.id,
          code: cardData.code,
          nameJp: cardData.name_jp,
          nameEn: cardData.name_en,
          releaseDate: cardData.release_date,
          imageUrl: cardData.image_url,
          createdAt: cardData.created_at,
          updatedAt: cardData.updated_at,
        },
        prices,
        snapshot: snapshotResult.rows[0] || null
      }
    } catch (error) {
      console.error('カード詳細取得エラー:', error)
      throw new Error('カード情報の取得に失敗しました')
    }
  }

  // 人気カード取得
  static async getPopular(limit: number = 10): Promise<Card[]> {
    try {
      const query = `
        SELECT c.*, COUNT(cp.id) as price_count
        FROM cards c
        LEFT JOIN card_prices cp ON c.id = cp.card_id
        GROUP BY c.id
        ORDER BY price_count DESC, c.created_at DESC
        LIMIT $1
      `

      const result = await db.query(query, [limit])
      return result.rows as Card[]
    } catch (error) {
      console.error('人気カード取得エラー:', error)
      throw new Error('人気カードの取得に失敗しました')
    }
  }
}