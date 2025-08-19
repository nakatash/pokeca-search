import { sql } from '@vercel/postgres'

// データベース接続クライアント
export const db = sql

// 接続テスト用の関数
export async function testConnection() {
  try {
    const result = await db`SELECT 1 as test`
    console.log('データベース接続成功:', result.rows[0])
    return true
  } catch (error) {
    console.error('データベース接続エラー:', error)
    return false
  }
}

// トランザクション実行用のヘルパー
export async function transaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  try {
    await db`BEGIN`
    const result = await callback()
    await db`COMMIT`
    return result
  } catch (error) {
    await db`ROLLBACK`
    throw error
  }
}