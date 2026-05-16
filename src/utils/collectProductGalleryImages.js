/**
 * Gộp ảnh SP + mọi biến thể (không trùng URL) — gallery PDP luôn đủ ảnh khi đổi loại.
 * @param {{ image?: string, images?: string[], variants?: Array<{ image?: string, images?: string[] }> }} product
 * @returns {string[]}
 */
export function collectProductGalleryImages(product) {
  if (!product) return []
  const seen = new Set()
  const out = []
  const add = (src) => {
    const s = String(src || '').trim()
    if (!s || seen.has(s)) return
    seen.add(s)
    out.push(s)
  }
  add(product.image)
  ;(product.images || []).forEach(add)
  ;(product.variants || []).forEach((v) => {
    add(v?.image)
    ;(v?.images || []).forEach(add)
  })
  return out
}

/**
 * Chỉ số ảnh chính khi chọn biến thể (trong gallery đã gộp).
 * @param {string[]} galleryImages
 * @param {{ image?: string, images?: string[] } | null | undefined} variant
 * @returns {number}
 */
export function getVariantPrimaryGalleryIndex(galleryImages, variant) {
  if (!Array.isArray(galleryImages) || galleryImages.length === 0) return 0
  if (!variant) return 0

  const candidates = []
  const variantImages = (variant.images ?? []).filter(Boolean)
  if (variantImages.length) candidates.push(...variantImages)
  if (variant.image) candidates.push(variant.image)

  for (const raw of candidates) {
    const s = String(raw).trim()
    if (!s) continue
    const idx = galleryImages.indexOf(s)
    if (idx >= 0) return idx
  }
  return 0
}
