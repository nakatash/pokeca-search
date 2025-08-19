import Link from 'next/link'
import { CardPriceWithShop } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PriceBadge } from '@/components/cards/price-badge'

interface PriceTableProps {
  prices: CardPriceWithShop[]
}

export function PriceTable({ prices }: PriceTableProps) {
  // 総コストでソート
  const sortedPrices = [...prices].sort((a, b) => a.総コスト - b.総コスト)

  if (prices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        現在、価格情報がありません
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="py-3 px-4 font-semibold text-sm">ショップ</th>
            <th className="py-3 px-4 font-semibold text-sm">状態</th>
            <th className="py-3 px-4 font-semibold text-sm">価格</th>
            <th className="py-3 px-4 font-semibold text-sm">送料</th>
            <th className="py-3 px-4 font-semibold text-sm">総コスト</th>
            <th className="py-3 px-4 font-semibold text-sm">在庫</th>
            <th className="py-3 px-4 font-semibold text-sm">配送</th>
            <th className="py-3 px-4 font-semibold text-sm"></th>
          </tr>
        </thead>
        <tbody>
          {sortedPrices.map((price, index) => (
            <tr key={price.id} className="border-b hover:bg-gray-50">
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{price.shop.name}</span>
                  {price.shop.isVerified && (
                    <Badge variant="success" className="text-xs">
                      認証済
                    </Badge>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{price.condition}</span>
                  {price.gradeType && price.gradeValue && (
                    <Badge variant="secondary" className="text-xs">
                      {price.gradeType} {price.gradeValue}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm">¥{price.priceJpy.toLocaleString()}</span>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-gray-600">
                  {price.shippingJpy > 0
                    ? `¥${price.shippingJpy.toLocaleString()}`
                    : '無料'}
                </span>
              </td>
              <td className="py-4 px-4">
                <PriceBadge
                  価格={price.priceJpy}
                  送料={price.shippingJpy}
                  showTotal={false}
                  size="sm"
                  className={index === 0 ? 'text-pokeca-primary' : ''}
                />
                {index === 0 && (
                  <Badge variant="success" className="ml-2 text-xs">
                    最安
                  </Badge>
                )}
              </td>
              <td className="py-4 px-4">
                <span className={`text-sm ${price.stockQty <= 3 ? 'text-red-600 font-medium' : ''}`}>
                  {price.stockQty > 0 ? `${price.stockQty}枚` : '在庫なし'}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-gray-600">
                  {price.etaDays ? `${price.etaDays}日` : '-'}
                </span>
              </td>
              <td className="py-4 px-4">
                <Link
                  href={price.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                >
                  <Button size="sm" variant="outline">
                    購入
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}