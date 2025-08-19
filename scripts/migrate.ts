#!/usr/bin/env tsx

import { readFileSync } from 'fs'
import { join } from 'path'
import { db, testConnection } from '@/lib/db/client'

async function runMigrations() {
  console.log('🚀 データベースマイグレーションを開始します...')

  // 接続テスト
  const isConnected = await testConnection()
  if (!isConnected) {
    console.error('❌ データベースに接続できません')
    console.log('環境変数 DATABASE_URL を確認してください')
    process.exit(1)
  }

  try {
    // スキーマファイルを読み込み
    const schemaPath = join(process.cwd(), 'lib', 'db', 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf8')

    console.log('📋 スキーマを実行中...')
    
    // SQLを分割して実行（複数のCREATE文があるため）
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.unsafe(statement)
          console.log(`✅ 実行完了: ${statement.substring(0, 50)}...`)
        } catch (error: any) {
          // テーブルが既に存在する場合はスキップ
          if (error.message?.includes('already exists')) {
            console.log(`⚠️  スキップ: ${statement.substring(0, 50)}... (既に存在)`)
          } else {
            throw error
          }
        }
      }
    }

    console.log('✅ マイグレーションが完了しました!')
  } catch (error) {
    console.error('❌ マイグレーション中にエラーが発生しました:', error)
    process.exit(1)
  }
}

// スクリプトが直接実行された場合
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('🎉 すべてのマイグレーションが完了しました!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 マイグレーションが失敗しました:', error)
      process.exit(1)
    })
}

export { runMigrations }