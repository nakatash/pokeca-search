import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'new' | 'hot' | 'trending' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-semibold transition-colors',
          {
            // サイズ
            'px-2 py-0.5 text-xs': size === 'sm',
            'px-3 py-1 text-sm': size === 'md',
            
            // バリアント - 公式サイト準拠カラー
            'bg-gray-100 text-gray-900': variant === 'default',
            'bg-pokeca-yellow text-amber-900 shadow-sm': variant === 'new',
            'bg-pokeca-red-primary text-white shadow-sm': variant === 'hot',
            'bg-gradient-to-r from-pokeca-yellow to-pokeca-amber text-amber-900 shadow-sm animate-pulse': variant === 'trending',
            'bg-pokeca-red-primary text-white': variant === 'primary',
            'bg-pokeca-blue-primary text-white': variant === 'secondary',
            'bg-green-500 text-white': variant === 'success',
            'bg-pokeca-red-light text-white': variant === 'warning',
            'bg-pokeca-red-dark text-white': variant === 'danger',
          },
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'