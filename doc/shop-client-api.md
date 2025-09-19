# ショップクライアントAPI仕様書

## 概要

ショップクライアントは、複数のオンラインショップからポケモンカードの価格情報を取得するための統一されたインターフェースを提供します。

## アーキテクチャ

```
types/shop-client.ts           # 型定義
lib/services/shop-clients/
  ├── base-client.ts          # 基底クラス
  ├── pokemontcg-client.ts    # Pokemon TCG APIクライアント
  └── index.ts                # ファクトリーとエクスポート
```

## 使用方法

### 基本的な使用例

```typescript
import { ShopClientFactory, ShopType, SortOption } from '@/lib/services/shop-clients'

// クライアントの取得
const client = ShopClientFactory.getClient(ShopType.POKEMON_TCG)

// カード検索
const result = await client.searchCards({
  query: 'リザードン',
  minPrice: 1000,
  maxPrice: 10000,
  sortBy: SortOption.PRICE_ASC,
  page: 1,
  limit: 20
})

// カード詳細取得
const card = await client.getCardDetail('card-id')
```

### API エンドポイント

```
GET /api/shops/search
```

クエリパラメータ:
- `q`: 検索クエリ（必須）
- `set`: セットコード
- `minPrice`: 最低価格
- `maxPrice`: 最高価格
- `sort`: ソート順（price_asc, price_desc, name_asc, name_desc, newest, popularity）
- `page`: ページ番号
- `limit`: 取得件数

## 実装済みクライアント

### Pokemon TCG API

- **URL**: https://pokemontcg.io
- **認証**: APIキー（オプション）
- **レート制限**:
  - APIキーなし: 250リクエスト/分
  - APIキーあり: 1000リクエスト/分
- **特徴**: 英語版カードのデータが豊富、TCGPlayerの価格情報付き

## データモデル

### ShopCard

```typescript
interface ShopCard {
  // 基本情報
  id: string                    // ショップ内の商品ID
  name: string                  // カード名（日本語）
  nameEn?: string              // カード名（英語）

  // セット情報
  setName?: string             // セット名
  setCode?: string             // セットコード
  cardNumber?: string          // カード番号

  // カード詳細
  rarity?: string              // レアリティ
  condition?: CardCondition    // カードの状態
  language?: CardLanguage      // 言語

  // 価格情報
  price: number                // 価格（円）
  originalPrice?: number       // 定価・元価格
  discountRate?: number        // 割引率

  // 在庫情報
  stock?: number               // 在庫数
  stockStatus?: StockStatus    // 在庫状態

  // 画像
  imageUrl?: string            // カード画像URL
  thumbnailUrl?: string        // サムネイル画像URL

  // ショップ情報
  shopName: string             // ショップ名
  shopUrl: string              // 商品ページURL

  // 日時
  lastUpdated?: Date           // 最終更新日時
}
```

### 列挙型

```typescript
enum CardCondition {
  MINT = 'mint',               // 完美品
  NEAR_MINT = 'near_mint',     // 極美品
  EXCELLENT = 'excellent',     // 美品
  GOOD = 'good',               // 良品
  PLAYED = 'played',           // プレイ用
  DAMAGED = 'damaged'          // 傷あり
}

enum StockStatus {
  IN_STOCK = 'in_stock',       // 在庫あり
  LOW_STOCK = 'low_stock',     // 残りわずか
  OUT_OF_STOCK = 'out_of_stock', // 在庫切れ
  PRE_ORDER = 'pre_order'      // 予約受付中
}

enum SortOption {
  PRICE_ASC = 'price_asc',     // 価格の昇順
  PRICE_DESC = 'price_desc',   // 価格の降順
  NAME_ASC = 'name_asc',       // 名前の昇順
  NAME_DESC = 'name_desc',     // 名前の降順
  NEWEST = 'newest',           // 新着順
  POPULARITY = 'popularity'    // 人気順
}
```

## エラーハンドリング

```typescript
try {
  const result = await client.searchCards({ query: 'test' })
} catch (error) {
  if (error instanceof RateLimitError) {
    // レート制限エラー
    console.log(`再試行まで${error.retryAfter}秒待機`)
  } else if (error instanceof ShopClientError) {
    // その他のショップクライアントエラー
    console.error(`エラー: ${error.message} (${error.code})`)
  }
}
```

## テスト

```bash
# テストスクリプトの実行
npx tsx scripts/test-shop-client.ts
```

## 今後の実装予定

- 駿河屋クライアント（HTMLスクレイピング）
- 遊々亭クライアント（HTMLスクレイピング）
- カードラッシュクライアント（HTMLスクレイピング）
- キャッシュ機能の追加
- バッチ処理用のワーカー実装

## 注意事項

- Pokemon TCG APIは非公式のコミュニティAPIです
- 画像の著作権は各カード会社に帰属します
- レート制限を守って利用してください
- 商用利用の際は各ショップの利用規約を確認してください