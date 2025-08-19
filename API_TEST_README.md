# Pokemon TCG API 実装テスト

## 🎯 概要

ポケカサーチでPokemon TCG APIからの実データ取得機能を実装・テストしました。

## 📡 実装したAPI連携

### データソース
- **Pokemon TCG API** (https://api.pokemontcg.io/v2/)
- **価格情報**: TCGPlayer, CardMarket
- **対応言語**: 英語メイン（日本語名は今後対応予定）

### 主な機能
1. **マーケットランキング**: 時価総額上位カードの取得
2. **カード検索**: 名前・セット・番号による検索
3. **価格情報**: USD/EUR → JPY変換
4. **統計情報**: 市場データの集計

## 🛠️ 実装ファイル

### 型定義
- `types/pokemon-tcg-api.ts`: Pokemon TCG API用の型定義
- `types/index.ts`: 型定義のエクスポート統合

### サービス層
- `lib/services/pokemon-tcg-service.ts`: Pokemon TCG API クライアント
- `lib/services/real-market-service.ts`: マーケットサービス実装
- `lib/utils/tcg-data-mapper.ts`: API データ → 内部形式変換

### API エンドポイント
- `/api/test/cards`: テスト用カードデータ取得
- `/api/test/stats`: テスト用統計データ取得

### テストページ
- `/test-api`: 実データ確認用ページ

## 🧪 テスト方法

### 1. 開発サーバー起動
```bash
npm run dev
```

### 2. APIテストページにアクセス
```
http://localhost:3000/test-api
```

### 3. 直接APIテスト
```bash
# カードデータテスト
curl http://localhost:3000/api/test/cards

# 統計データテスト  
curl http://localhost:3000/api/test/stats

# Pokemon TCG API直接テスト
curl "https://api.pokemontcg.io/v2/cards?q=name:pikachu&pageSize=3"
```

## 📊 データ変換仕様

### 価格変換
- **USD → JPY**: 1USD = 150円
- **EUR → JPY**: 1EUR = 165円
- **優先順位**: TCGPlayer > CardMarket

### 流通枚数推定
```typescript
Common: 2,000,000枚
Uncommon: 800,000枚  
Rare: 300,000枚
Rare Holo: 200,000枚
Ultra Rare: 100,000枚
Secret Rare: 50,000枚
```

### 市場変動率
- **24h変動**: -15% ~ +15% (ランダム)
- **7d変動**: -25% ~ +25% (ランダム)

## ⚡ パフォーマンス対策

### キャッシュ戦略
```typescript
// Next.js fetch with revalidation
next: { revalidate: 3600 } // 1時間キャッシュ

// API Response headers
'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
```

### レート制限
- Pokemon TCG API: APIキーなしで制限あり
- 推奨: 環境変数 `POKEMON_TCG_API_KEY` 設定

## 🎨 表示例

テストページでは以下が確認できます：

### マーケット統計
```
総時価総額: ¥45.2B
24h取引高: ¥12.8M  
登録カード数: 15,000
連携ショップ数: 2
```

### カードランキング
```
Rank | Card Name          | Price    | 24h   | Market Cap
-----|-------------------|----------|-------|------------  
1    | Blaine's Charizard| ¥97,500  | +15%  | ¥19.5B
2    | Pikachu Promo     | ¥15,000  | -8%   | ¥30.0B
```

## 🔄 今後の展開

### Phase 1 (完了)
- ✅ Pokemon TCG API基盤実装
- ✅ 基本的な価格情報取得
- ✅ テストページ作成

### Phase 2 (予定)
- 🔄 日本語カード名対応
- 🔄 より正確な為替レート取得
- 🔄 価格履歴データ保存

### Phase 3 (予定)  
- 📅 日本国内ショップ価格取得
- 📅 リアルタイム価格更新
- 📅 ユーザー向け検索API

## 🚨 注意事項

### API制限
- レート制限に注意（APIキー推奨）
- 大量リクエスト時は適切な間隔を空ける

### データ精度
- 価格は参考値（為替レート固定）
- 流通枚数は推定値
- 市場変動率は仮の値

### 法的考慮
- Pokemon TCG APIの利用規約遵守
- 商用利用時は要確認

---

## ✅ テスト結果確認

実装が正常に動作している場合：

1. `/test-api` ページで「APIテスト成功」が表示
2. 実際のポケモンカードデータが表示
3. 価格情報・ランキングが正しく表示
4. エラーなくページが読み込まれる

これで実データを使用したローカル動作確認の準備が完了しました！