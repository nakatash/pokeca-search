import { clsx } from 'clsx'

interface PriceBadgeProps {
  価格: number
  送料?: number
  showTotal?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PriceBadge({
  価格,
  送料 = 0,
  showTotal = true,
  size = 'md',
  className,
}: PriceBadgeProps) {
  const 総コスト = 価格 + 送料

  return (
    <div className={clsx('inline-flex flex-col', className)}>
      <span
        className={clsx('font-bold text-pokeca-primary', {
          'text-lg': size === 'sm',
          'text-xl': size === 'md',
          'text-2xl': size === 'lg',
        })}
      >
        ¥{総コスト.toLocaleString()}
      </span>
      {showTotal && 送料 > 0 && (
        <span className="text-xs text-gray-500">
          (本体: ¥{価格.toLocaleString()} + 送料: ¥{送料.toLocaleString()})
        </span>
      )}
    </div>
  )
}