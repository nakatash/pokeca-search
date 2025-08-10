# ポケカサーチ

ポケモンカードの価格比較・相場情報サービス

## 概要

ポケカサーチは、複数のショップからポケモンカードの価格情報を収集し、ユーザーが最適な購入判断をできるよう支援するWebサービスです。

## 主な機能

- 🔍 カード価格の横断検索
- 📊 価格推移チャート
- 🔔 価格アラート（メール/LINE通知）
- ⭐ お気に入り管理
- 📈 高騰/下落ランキング
- 🏪 信頼できるショップの価格比較

## 技術スタック

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Vercel Edge Functions/Serverless Functions
- **Database**: PostgreSQL (Vercel Postgres/Supabase)
- **Cache**: Vercel KV (Redis)
- **Queue**: Upstash QStash
- **Notifications**: SendGrid, LINE Messaging API

## セットアップ

### 前提条件

- Node.js 18.17以上
- npm または yarn
- PostgreSQL データベース

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集して必要な環境変数を設定

# データベースマイグレーション
npm run migrate

# 開発サーバーの起動
npm run dev
```

### 環境変数

`.env.example`を参考に、以下の環境変数を設定してください：

- データベース接続情報
- Redis接続情報
- 認証用シークレット
- 外部API認証情報（LINE、SendGrid等）

## 開発

```bash
# 開発サーバー
npm run dev

# 型チェック
npm run type-check

# リント
npm run lint

# フォーマット
npm run format

# テスト
npm run test
```

## プロジェクト構成

詳細は[PROJECT_STRUCTURE_README.md](./PROJECT_STRUCTURE_README.md)を参照してください。

## ライセンス

プライベートプロジェクト

## 貢献

現在、プライベート開発中です。