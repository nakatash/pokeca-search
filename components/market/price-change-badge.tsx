import { formatPercentage } from '@/lib/utils/format'

interface PriceChangeBadgeProps {
  value: number
  size?: 'sm' | 'md'
}

export function PriceChangeBadge({ value, size = 'sm' }: PriceChangeBadgeProps) {
  const isPositive = value >= 0
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'
  
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${
        isPositive
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      {formatPercentage(value)}
    </span>
  )
}