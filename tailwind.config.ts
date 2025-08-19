import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pokeca': {
          // 赤系（メインブランド）- 公式サイト準拠
          'red-primary': '#dc2626',   // メインロゴ・CTAボタン・価格表示
          'red-dark': '#b91c1c',      // ホバー状態・アクティブ状態
          'red-light': '#ef4444',     // エラー表示・警告・上昇トレンド
          
          // ブルー系（セカンダリ）
          'blue-deep': '#304160',     // ヘッダー・フッター（継続使用）
          'blue-primary': '#2563eb',  // リンク・情報表示・セカンダリボタン
          'blue-light': '#60a5fa',    // ホバー状態・選択状態背景
          
          // 背景系（モダン・クリーン）
          'bg-white': '#ffffff',      // ページメイン背景
          'bg-light': '#f8fafc',      // セクション分け・カード背景
          'bg-gray': '#f1f5f9',       // フォーム・検索バー・入力エリア
          
          // グレー系（テキスト・ニュートラル）
          'gray-dark': '#1e293b',     // フッター背景・濃いテキスト
          'gray-medium': '#64748b',   // 説明テキスト・無効状態
          'gray-light': '#cbd5e1',    // 境界線・区切り線
          
          // アクセント系（ポケモンブランド特有）
          'yellow': '#fbbf24',        // 特別な強調・バッジ・新着表示
          'amber': '#f59e0b',         // イエローのホバー状態・ゴールド表現
          
          // エイリアス（後方互換性維持）
          'primary': '#dc2626',       // メインカラー
          'secondary': '#2563eb',     // セカンダリカラー  
          'accent': '#fbbf24',        // アクセントカラー
          'dark': '#1e293b',          // ダークカラー
          'light': '#f8fafc',         // ライトカラー
        }
      },
      fontFamily: {
        sans: ['var(--font-noto-sans-jp)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config