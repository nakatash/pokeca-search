import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* サービス情報 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎴</span>
              <span className="font-bold text-xl">ポケカサーチ</span>
            </div>
            <p className="text-sm text-gray-400">
              ポケモンカードの価格を複数ショップで横断比較できるサービスです。
            </p>
          </div>

          {/* サービス */}
          <div>
            <h3 className="font-semibold mb-4">サービス</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/search" className="text-gray-400 hover:text-white">
                  カード検索
                </Link>
              </li>
              <li>
                <Link href="/rankings/spike-24h" className="text-gray-400 hover:text-white">
                  価格ランキング
                </Link>
              </li>
              <li>
                <Link href="/sets" className="text-gray-400 hover:text-white">
                  セット一覧
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white">
                  ブログ
                </Link>
              </li>
            </ul>
          </div>

          {/* 情報 */}
          <div>
            <h3 className="font-semibold mb-4">情報</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white">
                  ポケカサーチについて
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white">
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>

          {/* 提携ショップ */}
          <div>
            <h3 className="font-semibold mb-4">提携ショップ</h3>
            <p className="text-sm text-gray-400 mb-4">
              以下のショップと提携し、最新の価格情報を提供しています。
            </p>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>晴れる屋</li>
              <li>駿河屋</li>
              <li>カードラッシュ</li>
              <li>その他多数</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 ポケカサーチ. All rights reserved.</p>
          <p className="mt-2">
            ポケモンカードゲームは株式会社ポケモンの商標です。
            本サービスは株式会社ポケモンとは関係ありません。
          </p>
        </div>
      </div>
    </footer>
  )
}