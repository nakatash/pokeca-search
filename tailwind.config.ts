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
          'primary': '#FF6B6B',
          'secondary': '#4ECDC4',
          'accent': '#FFE66D',
          'dark': '#1A1A2E',
          'light': '#F7F7F7',
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