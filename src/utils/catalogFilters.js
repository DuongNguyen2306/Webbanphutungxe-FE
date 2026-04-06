import { normalizeSearch } from './string'

/**
 * @param {import('../data/products').Product[]} list
 * @param {{
 *   search: string
 *   brands: string[]
 *   vehicles: string[]
 *   parts: string[]
 *   priceMin: number
 *   priceMax: number
 *   inStockOnly: boolean
 * }} f
 */
export function filterCatalog(list, f) {
  const q = normalizeSearch(f.search.trim())

  return list.filter((p) => {
    if (q && !normalizeSearch(p.name).includes(q)) return false

    if (f.brands.length > 0 && !f.brands.includes(p.brand)) return false

    if (f.vehicles.length > 0 && !f.vehicles.includes(p.vehicleType)) {
      return false
    }

    if (f.parts.length > 0 && !f.parts.includes(p.partCategory)) return false

    const price = listPrice(p)
    if (price < f.priceMin || price > f.priceMax) return false

    if (f.inStockOnly && !inStock(p)) return false

    return true
  })
}

/** Giá hiển thị trên danh sách: thấp nhất trong biến thể */
export function listPrice(p) {
  if (!p.variants?.length) return p.salePrice
  return Math.min(...p.variants.map((v) => v.salePrice))
}

export function inStock(p) {
  if (!p.isAvailable) return false
  if (!p.variants?.length) return true
  return p.variants.some((v) => v.available)
}
