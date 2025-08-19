export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B'
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

export function formatCurrency(yen: number): string {
  return `¥${yen.toLocaleString()}`
}

export function formatPercentage(value: number, decimals: number = 1): string {
  const formatted = value.toFixed(decimals)
  return `${value >= 0 ? '+' : ''}${formatted}%`
}