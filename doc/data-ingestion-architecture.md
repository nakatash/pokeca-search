# データ取得・保存アーキテクチャ

## 概要

このドキュメントは、外部APIやスクレイピングで取得したポケモンカードデータをデータベースに保存するシステムの設計と実装について説明します。

## アーキテクチャ

```mermaid
graph TB
    A[外部API/ショップサイト] -->|データ取得| B[ShopClient]
    B --> C[ShopCard型]
    C --> D[CardIngestionService]
    D --> E[データ正規化]
    E --> F[(PostgreSQL)]

    G[PriceCollectorWorker] -->|定期実行| B
    H[Vercel Cron] -->|30分ごと| G

    F --> I[card_prices<br/>生データ]
    F --> J[cards<br/>マスタデータ]
    F --> K[price_snapshots<br/>集計データ]
```

## コンポーネント

### 1. CardIngestionService
**場所**: `lib/services/ingestion/card-ingestion.service.ts`

**責務**:
- カードマスタデータのUPSERT
- ショップ情報の管理
- 価格データの保存（重複チェック付き）
- スナップショット作成

**主要メソッド**:
```typescript
// カードマスタの更新
upsertCardMaster(shopCard: ShopCard): Promise<string>

// 価格データの保存
savePriceData(shopCard: ShopCard, cardId: string, shopId: number): Promise<void>

// バッチ処理
ingestBatch(shopCards: ShopCard[]): Promise<Result>

// スナップショット作成
createPriceSnapshot(cardId: string): Promise<void>
```

### 2. PriceCollectorWorker
**場所**: `workers/price-collector/index.ts`

**責務**:
- 定期的なデータ収集
- 複数ショップの管理
- エラーハンドリング
- レート制限の遵守

**設定**:
```typescript
{
  intervalMinutes: 30,      // 実行間隔
  maxCardsPerRun: 500,      // 最大取得数
  shopConfigs: [            // ショップ別設定
    {
      shopType: 'pokemontcg',
      enabled: true,
      queries: ['Charizard', 'Pikachu'],
      maxPages: 3
    }
  ]
}
```

### 3. Cronエンドポイント
**場所**: `app/api/cron/price-collector/route.ts`

**機能**:
- Vercel Cronからの定期実行
- 手動実行（開発環境）
- ワーカー管理

## データフロー

### 1. 新規価格データの保存

```sql
-- 重複チェック
SELECT id, price_jpy, stock_qty, updated_at
FROM card_prices
WHERE card_id = ? AND shop_id = ? AND condition = ?
ORDER BY created_at DESC LIMIT 1;

-- 条件を満たす場合のみINSERT
INSERT INTO card_prices (
  card_id, shop_id, condition, price_jpy,
  shipping_jpy, stock_qty, url, collected_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
```

### 2. 重複判定ロジック

新規レコードを作成する条件:
- 既存データが存在しない
- 価格が変更された
- 在庫数が50%以上変動
- 最終更新から1時間以上経過

### 3. スナップショット作成

```sql
-- 1時間ごとの集計
INSERT INTO price_snapshots (
  card_id, ts, min_jpy, median_jpy, max_jpy, shop_count
)
SELECT
  card_id,
  date_trunc('hour', now()),
  MIN(price_jpy + shipping_jpy),
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_jpy + shipping_jpy),
  MAX(price_jpy + shipping_jpy),
  COUNT(DISTINCT shop_id)
FROM card_prices
WHERE card_id = ? AND stock_qty > 0
  AND collected_at >= date_trunc('hour', now());
```

## 環境設定

### 必要な環境変数

```bash
# データベース
DATABASE_URL=postgresql://user:pass@localhost:5432/pokeca

# Pokemon TCG API
POKEMON_TCG_API_KEY=your-api-key

# ワーカー設定
PRICE_COLLECTOR_INTERVAL=1440      # 実行間隔（分）= 24時間
PRICE_COLLECTOR_MAX_CARDS=2000     # 最大取得数
POKEMON_TCG_ENABLED=true           # Pokemon TCG APIの有効化
POKEMON_TCG_QUERIES=Charizard,Pikachu,ex,vstar,vmax,Mew,Rayquaza,Lucario  # 検索クエリ
POKEMON_TCG_MAX_PAGES=5            # 最大ページ数

# Cronジョブ認証
CRON_SECRET=your-secret-token
```

## 実行方法

### 1. ローカルテスト

```bash
# Ingestionサービスのテスト
npx tsx scripts/test-ingestion.ts

# ワーカーのテスト
npx tsx scripts/test-worker.ts test

# ワーカーの単発実行
npx tsx scripts/test-worker.ts run

# ワーカーの継続実行
npx tsx scripts/test-worker.ts start
```

### 2. 手動実行（開発環境）

```bash
# 単発実行
curl -X POST http://localhost:3000/api/cron/price-collector \
  -H "Content-Type: application/json" \
  -d '{"action": "run"}'

# ワーカー開始
curl -X POST http://localhost:3000/api/cron/price-collector \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# ステータス確認
curl -X POST http://localhost:3000/api/cron/price-collector \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'
```

### 3. 本番環境（Vercel）

Vercel Cronにより毎日午前2時に自動実行されます。

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/price-collector",
      "schedule": "0 0 2 * * *"
    }
  ]
}
```

## モニタリング

### ログ確認
```bash
# Vercelログ
vercel logs --follow

# ローカルログ
tail -f logs/price-collector.log
```

### データベース確認
```sql
-- 最近の価格データ
SELECT * FROM card_prices
ORDER BY collected_at DESC
LIMIT 10;

-- カード別の価格履歴
SELECT * FROM card_prices
WHERE card_id = 'sv4a-205'
ORDER BY created_at DESC;

-- スナップショット確認
SELECT * FROM price_snapshots
WHERE card_id = 'sv4a-205'
ORDER BY ts DESC;
```

## トラブルシューティング

### よくある問題

1. **データベース接続エラー**
   - DATABASE_URLが正しく設定されているか確認
   - PostgreSQLが起動しているか確認

2. **API制限エラー**
   - APIキーが設定されているか確認
   - レート制限に達していないか確認

3. **重複データ**
   - 重複チェックロジックが正しく動作しているか確認
   - タイムスタンプの精度を確認

## 今後の拡張

- [ ] 他ショップのクライアント追加
- [ ] HTMLスクレイピング対応
- [ ] 画像データの保存
- [ ] 価格予測モデルの実装
- [ ] リアルタイム通知機能