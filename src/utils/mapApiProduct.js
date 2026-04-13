/**
 * @typedef {Object} ApiVariantRaw
 * @property {string} [_id]
 * @property {string} [typeName]
 * @property {string} [color]
 * @property {string} [size]
 * @property {number} price
 * @property {number} [originalPrice]
 * @property {boolean} [isAvailable]
 * @property {number} [stockQuantity]
 * @property {string[]} [images]
 */

/**
 * Biến thể đã chuẩn hoá cho storefront / giỏ hàng.
 * @typedef {Object} ProductVariantMapped
 * @property {string} id — ObjectId string từ API
 * @property {string} label — variantLabel (typeName · color · size)
 * @property {string} typeName
 * @property {string} color
 * @property {string} size
 * @property {number} salePrice
 * @property {number|null} originalPrice
 * @property {boolean} available
 * @property {string[]} images — gallery riêng biến thể
 */

/**
 * @typedef {Object} ProductMapped
 * @property {string} id
 * @property {string} name
 * @property {string} image — ảnh đại diện: product.images[0] hoặc variants[0].images[0]
 * @property {string[]} images
 * @property {ProductVariantMapped[]} variants
 * @property {boolean} [_fromApi]
 */

function variantLabel(v) {
  const parts = [v.typeName, v.color, v.size].filter(
    (x) => x != null && String(x).trim() !== '',
  )
  return parts.length ? parts.join(' · ') : 'Mặc định'
}

function computeDiscountTag(rawVariants) {
  for (const v of rawVariants || []) {
    const o = v.originalPrice
    const s = v.price
    if (o != null && s != null && o > s) {
      const pct = Math.round(((o - s) / o) * 100)
      return `-${pct}%`
    }
  }
  return null
}

/**
 * Ảnh đại diện danh sách: ưu tiên product.images[0], không có thì variants[0].images[0].
 * @param {{ images?: string[], variants?: ApiVariantRaw[] }} p
 */
function pickListImage(p) {
  const pi = p.images?.filter(Boolean)
  if (pi?.length) return pi[0]
  for (const v of p.variants || []) {
    const vi = v.images?.filter(Boolean)
    if (vi?.length) return vi[0]
  }
  return ''
}

/** Chuẩn hóa document Product từ API MongoDB cho storefront */
export function mapApiProduct(p) {
  const rawVariants = p.variants || []
  const variants = rawVariants.map((v) => {
    const imgs = Array.isArray(v.images)
      ? v.images.map((u) => String(u).trim()).filter(Boolean)
      : []
    return {
      id: String(v._id),
      label: variantLabel(v),
      typeName: v.typeName ?? '',
      color: v.color ?? '',
      size: v.size ?? '',
      salePrice: Number(v.price),
      originalPrice: v.originalPrice != null ? Number(v.originalPrice) : null,
      available: v.isAvailable !== false,
      stockQuantity: Number(v.stockQuantity ?? 0),
      images: imgs,
    }
  })

  const prices = variants
    .map((v) => v.salePrice)
    .filter((n) => Number.isFinite(n))
  const minPrice = prices.length ? Math.min(...prices) : 0
  const originals = variants
    .map((v) => v.originalPrice)
    .filter((n) => n != null && n > minPrice)

  const isAvailable = variants.some((v) => v.available)

  const productImages = Array.isArray(p.images) ? p.images.filter(Boolean) : []

  return {
    id: String(p._id),
    name: p.name,
    description: p.description ?? '',
    slug: p.slug,
    image: pickListImage({ images: productImages, variants: rawVariants }),
    images: productImages,
    originalPrice: originals.length ? Math.max(...originals) : null,
    salePrice: minPrice,
    discountTag: computeDiscountTag(rawVariants),
    isAvailable,
    brand: p.brand ?? 'honda',
    vehicleType: p.vehicleType ?? 'scooter',
    partCategory: p.partCategory ?? 'accessories',
    homeFeature: p.homeFeature ?? null,
    showOnStorefront: p.showOnStorefront !== false,
    rating: p.rating ?? 4.5,
    reviewCount: p.reviewCount ?? 0,
    soldCount: p.soldCount ?? 0,
    tags: Array.isArray(p.tags) ? p.tags.map((x) => String(x)) : [],
    compatibleVehicles: Array.isArray(p.compatibleVehicles)
      ? p.compatibleVehicles.map((x) => String(x))
      : [],
    categoryId: p.category?._id ? String(p.category._id) : null,
    categoryName: p.category?.name ?? '',
    variants,
    _fromApi: true,
  }
}
