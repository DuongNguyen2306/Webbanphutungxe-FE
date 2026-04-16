/**
 * @typedef {Object} ApiVariantRaw
 * @property {string} [_id]
 * @property {string} [typeName]
 * @property {string} [color]
 * @property {string} [size]
 * @property {number} price
 * @property {number} [originalPrice]
 * @property {boolean} [isAvailable]
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

function slugifyText(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeAttributes(rawAttributes = [], rawVariants = []) {
  if (Array.isArray(rawAttributes) && rawAttributes.length) {
    return rawAttributes.map((attr, index) => ({
      name: String(attr?.name || `Thuộc tính ${index + 1}`),
      key: String(attr?.name || `Thuộc tính ${index + 1}`),
      values: Array.isArray(attr?.values)
        ? Array.from(new Set(attr.values.map((v) => String(v || '').trim()).filter(Boolean)))
        : [],
    }))
  }

  const legacyFields = [
    { name: 'Loại', key: 'typeName' },
    { name: 'Màu sắc', key: 'color' },
    { name: 'Kích thước', key: 'size' },
  ]
  return legacyFields
    .map((field, index) => {
      const values = Array.from(
        new Set(
          rawVariants
            .map((variant) => String(variant?.[field.key] || '').trim())
            .filter(Boolean),
        ),
      )
      if (!values.length) return null
      return {
        name: field.name,
        key: field.name,
        values,
      }
    })
    .filter(Boolean)
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

function toSafeNumber(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/** Chuẩn hóa document Product từ API MongoDB cho storefront */
export function mapApiProduct(p) {
  const rawVariants = p.variants || []
  const attributes = normalizeAttributes(p.attributes || [], rawVariants)
  const variants = rawVariants.map((v) => {
    const imgs = [
      ...(Array.isArray(v.images) ? v.images : []),
      v.image,
    ]
      .map((u) => String(u || '').trim())
      .filter(Boolean)
    const apiAttributeValues =
      v.attributeValues && typeof v.attributeValues === 'object' ? v.attributeValues : {}
    const legacyAttributeValues = {}
    if (v.typeName && attributes[0]) legacyAttributeValues[attributes[0].key] = String(v.typeName)
    if (v.color && attributes[1]) legacyAttributeValues[attributes[1].key] = String(v.color)
    if (v.size && attributes[2]) legacyAttributeValues[attributes[2].key] = String(v.size)
    const normalizedAttributeValues = {}
    Object.entries({ ...legacyAttributeValues, ...apiAttributeValues }).forEach(([k, value]) => {
      const key = String(k || '').trim()
      normalizedAttributeValues[key] = String(value || '')
    })
    const key =
      String(v.key || '').trim() ||
      Object.values(normalizedAttributeValues)
        .map((value) => slugifyText(value))
        .filter(Boolean)
        .join('-') ||
      String(v._id || '')
    const labelFromAttributes = Object.values(normalizedAttributeValues).filter(Boolean).join(' · ')
    const variantId = String(v._id ?? v.id ?? key)
    return {
      id: variantId,
      key,
      label: labelFromAttributes || variantLabel(v),
      typeName: v.typeName ?? '',
      color: v.color ?? '',
      size: v.size ?? '',
      attributeValues: normalizedAttributeValues,
      salePrice: Number(v.price),
      originalPrice: v.originalPrice != null ? Number(v.originalPrice) : null,
      available: v.isAvailable !== false,
      stock:
        v.stock != null
          ? Number(v.stock)
          : v.stockQuantity != null
            ? Number(v.stockQuantity)
            : null,
      sku: v.sku ?? '',
      image: imgs[0] || '',
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
  const wishlistCountRaw =
    p.wishlistCount ??
    p.favoriteCount ??
    p.likesCount ??
    p.likeCount ??
    p.wishlist?.count ??
    0

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
    wishlistCount: Math.max(0, toSafeNumber(wishlistCountRaw, 0)),
    tags: Array.isArray(p.tags) ? p.tags.map((x) => String(x)) : [],
    compatibleVehicles: Array.isArray(p.compatibleVehicles)
      ? p.compatibleVehicles.map((x) => String(x))
      : [],
    categoryId: p.category?._id ? String(p.category._id) : null,
    categoryName: p.category?.name ?? '',
    attributes,
    variants,
    _fromApi: true,
  }
}
