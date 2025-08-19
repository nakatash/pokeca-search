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
          'red-dark': '#a82028',      // ロゴ・強調用赤
          'red-light': '#c85048',     // 補助強調赤
          'bg-light': '#a8b8c8',      // 背景用ライトグレー
          'blue-deep': '#304160',     // ヘッダー等のブルー
          'gray-dark': '#272536',     // 全体の深めグレー
          'primary': '#a82028',       // メインカラー（赤）
          'secondary': '#304160',     // セカンダリカラー（青）
          'accent': '#c85048',        // アクセントカラー（明るい赤）
          'dark': '#272536',          // ダークカラー
          'light': '#a8b8c8',         // ライトカラー
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