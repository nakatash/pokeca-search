# CLAUDE.md

このファイルは、このリポジトリで作業する際のClaude Code (claude.ai/code) への指針を提供します。

## 重要な指針

**このプロジェクトでは、すべてのコメント、ドキュメント、変数名、コミットメッセージを日本語で記載してください。**

## コマンド一覧

### 開発
```bash
npm run dev          # 開発サーバーを起動 (http://localhost:3000)
npm run build        # 本番用ビルド
npm run start        # 本番サーバーを起動
```

### コード品質
```bash
npm run type-check   # TypeScriptの型チェック
npm run lint         # ESLintを実行
npm run format       # Prettierでコードを整形
```

### テスト
```bash
npm run test         # ユニットテストを実行
npm run test:watch   # ウォッチモードでテストを実行
npm run test:e2e     # PlaywrightでE2Eテストを実行
```

### データベース・スクリプト
```bash
npm run migrate      # データベースマイグレーション実行 (scripts/migrate.ts)
npm run seed         # 初期データ投入 (scripts/seed.ts)
npm run generate-sitemap  # サイトマップ生成 (scripts/generate-sitemap.ts)
```

## アーキテクチャ概要

ポケモンカード価格比較サービス。Next.js 14 App Routerで構築。複数の信頼できるショップから価格を収集し、リアルタイムで価格比較、アラート、市場分析を提供。

### データフローの概要
1. **価格取得**: ワーカーが20-40分間隔でショップAPI/HTMLから価格を取得
2. **データ正規化**: 生データを正規化してPostgreSQLに保存
3. **集計処理**: 1時間ごとにスナップショットで最小/中央値/最大価格を計算
4. **キャッシュ**: Vercel KV (Redis)で頻繁にアクセスされるデータをキャッシュ
5. **配信**: SSR/ISRページで10-60分の再検証期間でデータを提供

### 主要なビジネスロジック

#### 総コスト計算
```
総コスト = 本体価格 + 送料(地域/条件別) + 手数料(必要なら)
```
価格比較は常に総コストを表示（商品価格のみではない）

#### ワーカースケジュール
- 価格取得: 20-40分間隔（ショップごとにスロットリング）
- 集計: 1時間ごと
- ランキング: 1日3回（8:00、14:00、22:00）
- アラート: 5分ごと

### 認証
- JWTトークン + HttpOnlyクッキーでのリフレッシュトークン
- メール/パスワード認証とLINEログインをサポート
- 保護されたルートは `(auth)` ルートグループを使用

### 外部サービス連携
- **ショップ**: 各ショップは `workers/ingestor/parsers/` にカスタムパーサーを持つ
- **通知**: メールはSendGrid、プッシュ通知はLINE Messaging API
- **CMS**: ブログコンテンツにContentful/Sanityを使用
- **キュー**: ジョブスケジューリングにUpstash QStashを使用

### データベーススキーマ
主要テーブル: `shops`、`cards`、`card_prices`、`price_snapshots`、`users`、`favorites`、`alerts`
詳細は `lib/db/schema.ts` を参照

### API設計
- RESTエンドポイントは `/app/api/` 配下
- 主要エンドポイント: `/api/cards`、`/api/rankings`、`/api/favorites`、`/api/alerts`
- すべてのAPIは正規化されたレスポンスと適切なエラーハンドリングを返す

### パフォーマンス要件
- モバイルでLCP < 2.5秒
- カード詳細ページはISR
- 価格データは10分TTLでKVキャッシュ
- サイトマップは10万URLで分割

### セキュリティ考慮事項
- すべての外部ショップデータは検証が必要
- アフィリエイトリンクは `/out?sid=..&cid=..` リダイレクトを使用
- レート制限: KVトークンバケットで60リクエスト/分/IP