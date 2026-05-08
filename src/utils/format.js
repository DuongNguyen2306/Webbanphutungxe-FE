export function formatVnd(value) {
  if (value == null || Number.isNaN(value)) return ''
  return `${Number(value).toLocaleString('vi-VN')}đ`
}

export function formatCompactCount(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n < 1000) return String(Math.floor(n))
  if (n < 1_000_000) {
    const compact = n / 1000
    return `${Number(compact.toFixed(compact >= 10 ? 0 : 1)).toString()}k`
  }
  const compact = n / 1_000_000
  return `${Number(compact.toFixed(compact >= 10 ? 0 : 1)).toString()}m`
}
