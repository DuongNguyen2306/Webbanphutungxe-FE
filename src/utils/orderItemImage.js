export function toAbsoluteImageUrl(url) {
  if (!url) return ''
  const src = String(url).trim()
  if (!src) return ''
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')) {
    return src
  }
  const normalizedPath = src.startsWith('/') ? src : `/${src}`
  const apiBase = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')
  if (apiBase) return `${apiBase}${normalizedPath}`
  return normalizedPath
}

export function resolveOrderItemImage(item) {
  const candidates = [
    item?.thumbnail,
    item?.variant?.images?.[0],
    item?.product?.images?.[0],
  ]
  const firstValid = candidates.find((v) => typeof v === 'string' && v.trim())
  return toAbsoluteImageUrl(firstValid || '')
}
