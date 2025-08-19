import { db } from '../client'
import { Ranking, RankingType, Card } from '@/types/database'

export class RankingRepository {
  // ランキング取得
  static async getRanking(type: RankingType, limit: number = 50) {
    try {
      const query = `
        SELECT 
          r.*,
          c.id as card_id,
          c.set_id,
          c.number,
          c.name_jp,
          c.name_en,
          c.rarity,
          c.image_url,
          s.name_jp as set_name_jp,
          s.code as set_code,
          ps.min_jpy as current_min_price
        FROM rankings r
        LEFT JOIN cards c ON r.card_id = c.id
        LEFT JOIN sets s ON c.set_id = s.id
        LEFT JOIN LATERAL (
          SELECT min_jpy
          FROM price_snapshots 
          WHERE card_id = c.id 
          ORDER BY ts DESC 
          LIMIT 1
        ) ps ON true
        WHERE r.type = $1
        ORDER BY r.rank ASC
        LIMIT $2
      `

      const result = await db.query(query, [type, limit])

      return result.rows.map((row: any) => ({
        ranking: {
          id: row.id,
          cardId: row.card_id,
          type: row.type,
          deltaPercent24h: row.delta_percent_24h,
          deltaPercent7d: row.delta_percent_7d,
          rank: row.rank,
          updatedAt: row.updated_at,
        } as Ranking,
        card: {
          id: row.card_id,
          setId: row.set_id,
          number: row.number,
          nameJp: row.name_jp,
          nameEn: row.name_en,
          rarity: row.rarity,
          imageUrl: row.image_url,
          releaseDate: row.release_date,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        } as Card,
        setInfo: {
          nameJp: row.set_name_jp,
          code: row.set_code,
        },
        currentPrice: row.current_min_price,
      }))
    } catch (error) {
      console.error('ランキング取得エラー:', error)
      throw new Error('ランキングの取得に失敗しました')
    }
  }

  // ランキング更新（バッチ処理用）
  static async updateRankings(type: RankingType) {
    try {
      let calculationQuery: string

      switch (type) {
        case 'spike_24h':
          calculationQuery = `
            WITH price_changes AS (
              SELECT 
                ps1.card_id,
                ps1.min_jpy as current_price,
                ps2.min_jpy as previous_price,
                CASE 
                  WHEN ps2.min_jpy > 0 THEN 
                    ((ps1.min_jpy - ps2.min_jpy)::FLOAT / ps2.min_jpy) * 100
                  ELSE 0
                END as delta_percent
              FROM price_snapshots ps1
              LEFT JOIN price_snapshots ps2 ON ps1.card_id = ps2.card_id
              WHERE ps1.ts >= NOW() - INTERVAL '1 hour'
                AND ps2.ts >= NOW() - INTERVAL '25 hours' 
                AND ps2.ts <= NOW() - INTERVAL '23 hours'
            ),
            ranked_changes AS (
              SELECT 
                card_id,
                delta_percent,
                ROW_NUMBER() OVER (ORDER BY delta_percent DESC) as rank
              FROM price_changes
              WHERE delta_percent > 0
              ORDER BY delta_percent DESC
              LIMIT 100
            )
            INSERT INTO rankings (card_id, type, delta_percent_24h, rank, updated_at)
            SELECT card_id, $1, delta_percent, rank, NOW()
            FROM ranked_changes
            ON CONFLICT (card_id, type) 
            DO UPDATE SET 
              delta_percent_24h = EXCLUDED.delta_percent_24h,
              rank = EXCLUDED.rank,
              updated_at = NOW()
          `
          break

        case 'drop_24h':
          calculationQuery = `
            WITH price_changes AS (
              SELECT 
                ps1.card_id,
                ps1.min_jpy as current_price,
                ps2.min_jpy as previous_price,
                CASE 
                  WHEN ps2.min_jpy > 0 THEN 
                    ((ps1.min_jpy - ps2.min_jpy)::FLOAT / ps2.min_jpy) * 100
                  ELSE 0
                END as delta_percent
              FROM price_snapshots ps1
              LEFT JOIN price_snapshots ps2 ON ps1.card_id = ps2.card_id
              WHERE ps1.ts >= NOW() - INTERVAL '1 hour'
                AND ps2.ts >= NOW() - INTERVAL '25 hours' 
                AND ps2.ts <= NOW() - INTERVAL '23 hours'
            ),
            ranked_changes AS (
              SELECT 
                card_id,
                delta_percent,
                ROW_NUMBER() OVER (ORDER BY delta_percent ASC) as rank
              FROM price_changes
              WHERE delta_percent < 0
              ORDER BY delta_percent ASC
              LIMIT 100
            )
            INSERT INTO rankings (card_id, type, delta_percent_24h, rank, updated_at)
            SELECT card_id, $1, delta_percent, rank, NOW()
            FROM ranked_changes
            ON CONFLICT (card_id, type) 
            DO UPDATE SET 
              delta_percent_24h = EXCLUDED.delta_percent_24h,
              rank = EXCLUDED.rank,
              updated_at = NOW()
          `
          break

        default:
          throw new Error(`未サポートのランキングタイプ: ${type}`)
      }

      // 古いランキングを削除
      await db.query('DELETE FROM rankings WHERE type = $1', [type])

      // 新しいランキングを計算・挿入
      await db.query(calculationQuery, [type])

      console.log(`${type} ランキングを更新しました`)
    } catch (error) {
      console.error(`ランキング更新エラー (${type}):`, error)
      throw new Error('ランキングの更新に失敗しました')
    }
  }

  // 全ランキングタイプの更新
  static async updateAllRankings() {
    const types: RankingType[] = ['spike_24h', 'drop_24h', 'spike_7d', 'drop_7d']
    
    for (const type of types) {
      try {
        await this.updateRankings(type)
      } catch (error) {
        console.error(`${type} ランキング更新でエラー:`, error)
        // エラーがあっても他のランキングは継続
      }
    }
  }
}