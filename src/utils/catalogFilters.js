import { normalizeSearch } from './string'

/**
 * @param {import('../data/products').Product[]} list
 * @param {{
 *   search: string
 *   brands: string[]
 *   vehicles: string[]
 *   parts: string[]
 *   priceMin: number
 *   priceMax: number | null
 *   inStockOnly: boolean
 * }} f
 */
function productSearchBlob(p) {
  const tags = Array.isArray(p.tags) ? p.tags : []
  const vehicles = Array.isArray(p.compatibleVehicles) ? p.compatibleVehicles : []
  const parts = [
    p.name,
    p.description,
    p.categoryName,
    ...tags,
    ...vehicles,
  ]
  return normalizeSearch(parts.map((x) => String(x || '')).join(' '))
}

export function filterCatalog(list, f) {
  const q = normalizeSearch(f.search.trim())

  return list.filter((p) => {
    if (q && !productSearchBlob(p).includes(q)) return false

    if (f.brands.length > 0 && !f.brands.includes(p.brand)) return false

    if (f.vehicles.length > 0 && !f.vehicles.includes(p.vehicleType)) {
      return false
    }

    if (f.parts.length > 0 && !f.parts.includes(p.partCategory)) return false

    const price = listPrice(p)
    if (price < f.priceMin) return false
    if (f.priceMax != null && price > f.priceMax) return false

    if (f.inStockOnly && !inStock(p)) return false

    return true
  })
}

/** Giá hiển thị trên danh sách: thấp nhất trong biến thể */
export function listPrice(p) {
  if (!p.variants?.length) return Number(p.salePrice ?? 0)
  return Math.min(
    ...p.variants.map((v) => Number(v.salePrice ?? v.price ?? 0)),
  )
}

export function inStock(p) {
  if (p.isAvailable === false) return false
  if (!p.variants?.length) return p.isAvailable !== false
  return p.variants.some((v) => {
    const a = v.available ?? v.isAvailable
    return a !== false
  })
}
