import { MarketStats } from '@/types/market'
import { formatCurrency, formatNumber } from '@/lib/utils/format'

interface MarketStatsProps {
  stats: MarketStats
}

export function MarketStatsSection({ stats }: MarketStatsProps) {
  const statsData = [
    {
      label: '総時価総額',
      value: formatCurrency(stats.総時価総額),
      shortValue: formatNumber(stats.総時価総額),
    },
    {
      label: '24h取引高', 
      value: formatCurrency(stats.取引高24h),
      shortValue: formatNumber(stats.取引高24h),
    },
    {
      label: '登録カード数',
      value: stats.登録カード数.toLocaleString(),
    },
    {
      label: '連携ショップ数',
      value: stats.連携ショップ数.toString(),
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statsData.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm text-center">
          <div className="text-2xl font-bold text-pokeca-primary mb-2">
            {stat.shortValue || stat.value}
          </div>
          <div className="text-gray-600 text-sm">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}