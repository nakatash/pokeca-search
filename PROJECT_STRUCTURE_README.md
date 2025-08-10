# ポケカサーチ プロジェクト構成ガイド

## 概要
本プロジェクトはNext.js 14 (App Router) + TypeScript + Vercelで構築されたポケモンカード価格比較サービスです。

## ディレクトリ構成詳細

### 📁 `/app` - Next.js App Router
メインのアプリケーションディレクトリ。ファイルベースルーティングを使用。

#### ルートグループ
- `(auth)` - 認証が必要なページ群
- `(public)` - 公開ページ群

#### 主要ルート
- `/` - ホームページ
- `/cards/[setId]/[cardId]` - カード詳細ページ
- `/sets/[setId]` - セット（新弾）特設ページ
- `/rankings/[type]` - ランキングページ
- `/search` - 検索結果ページ
- `/blog/[slug]` - ブログ記事ページ

### 📁 `/components` - UIコンポーネント
再利用可能なReactコンポーネント。機能別に分類。

#### サブディレクトリ
- `ui/` - 基本的なUIパーツ（ボタン、インプット等）
- `cards/` - カード関連の複合コンポーネント
- `shop/` - ショップ情報表示コンポーネント
- `search/` - 検索機能コンポーネント
- `user/` - ユーザー機能コンポーネント
- `layout/` - レイアウト構成要素

### 📁 `/lib` - コアライブラリ
ビジネスロジックとユーティリティ関数。

#### 主要モジュール
- `api/` - APIクライアント層
- `db/` - データベース接続とスキーマ
- `cache/` - Redis/KVキャッシュ管理
- `auth/` - 認証・認可ロジック
- `utils/` - 汎用ユーティリティ
- `hooks/` - カスタムReactフック

### 📁 `/workers` - バックグラウンドワーカー
定期実行されるジョブワーカー。

#### ワーカー種別
- `ingestor/` - 価格データ取得（20-40分間隔）
- `aggregator/` - データ集計（1時間毎）
- `ranker/` - ランキング計算（1日3回）
- `notifier/` - アラート通知（5分毎）

### 📁 `/types` - TypeScript型定義
プロジェクト全体で使用される型定義。

## 技術スタック詳細

### フロントエンド
- **Next.js 14** - App Router使用
- **TypeScript** - 型安全性確保
- **TailwindCSS** - ユーティリティファーストCSS
- **React Query** - データフェッチング（推奨）

### バックエンド
- **Vercel** - ホスティング（Edge/Serverless Functions）
- **PostgreSQL** - メインDB（Vercel Postgres/Supabase）
- **Vercel KV** - Redisキャッシュ
- **Upstash QStash** - ジョブキューイング

### 外部サービス
- **SendGrid** - メール送信
- **LINE Messaging API** - LINE通知
- **Contentful/Sanity** - ヘッドレスCMS
- **Vercel Analytics** - アクセス解析

## 開発フロー

### 初期セットアップ
```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local

# DB マイグレーション
npm run migrate

# 開発サーバー起動
npm run dev
```

### コンポーネント開発
1. `/components`配下に機能別に作成
2. Storybookでの単体確認（オプション）
3. 単体テスト作成

### API開発
1. `/app/api`配下にRoute Handler作成
2. `/lib/api`にクライアント実装
3. 型定義を`/types`に追加

### ワーカー開発
1. `/workers`配下に実装
2. ローカルではスクリプトとして実行
3. 本番ではQStashでスケジュール実行

## デプロイメント

### 環境
- **開発環境** - ローカル開発
- **プレビュー環境** - Vercelプレビュー環境
- **本番環境** - 本番環境

### デプロイフロー
1. feature branchで開発
2. PRでプレビュー環境確認
3. mainマージで自動本番デプロイ

## ベストプラクティス

### コード規約
- ESLint/Prettierの設定に従う
- コンポーネントは関数コンポーネントで記述
- 型定義を必ず行う
- **すべてのコメント、ドキュメント、変数名は日本語で記載**

### パフォーマンス
- 画像は`next/image`使用
- 動的インポートで初期バンドル削減
- ISR/SSGを適切に使い分け

### セキュリティ
- 環境変数で機密情報管理
- SQLインジェクション対策
- XSS対策（React標準で対応）

## トラブルシューティング

### よくある問題
1. **型エラー** - `npm run type-check`で確認
2. **ビルドエラー** - `npm run build`でローカル確認
3. **DB接続エラー** - 環境変数確認

### デバッグ方法
- Next.jsデバッグ: `NODE_OPTIONS='--inspect' npm run dev`
- ワーカーデバッグ: 個別スクリプトとして実行

## 参考リンク
- [Next.js App Router](https://nextjs.org/docs/app)
- [Vercel ドキュメント](https://vercel.com/docs)
- [TailwindCSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)