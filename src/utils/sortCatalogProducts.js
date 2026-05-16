import { listPrice } from './catalogFilters'

function normalizeBadgeTagsForSort(tags) {
  if (!Array.isArray(tags)) return []
  return tags.map((t) => String(t || '').trim().toLowerCase()).filter(Boolean)
}

/**
 * Thứ tự ưu tiên hiển thị trang chủ khi sort = mặc định (ổn định trong từng nhóm).
 * 0 = mới / hàng mới về, 1 = bán chạy, 2 = nổi bật, 3 = còn lại.
 * @param {import('../data/products').Product} p
 */
export function storefrontDisplayPriority(p) {
  const t = normalizeBadgeTagsForSort(p.badgeTags)
  let r = 3
  if (t.includes('new')) r = Math.min(r, 0)
  if (t.includes('best-seller')) r = Math.min(r, 1)
  if (t.includes('featured')) r = Math.min(r, 2)
  return r
}

/**
 * @param {import('../data/products').Product[]} items — đã lọc, thường đúng thứ tự BE
 */
export function applyStorefrontDefaultOrdering(items) {
  return [...items]
    .map((p, idx) => ({ p, idx, pr: storefrontDisplayPriority(p) }))
    .sort((a, b) => (a.pr !== b.pr ? a.pr - b.pr : a.idx - b.idx))
    .map((x) => x.p)
}

/**
 * @param {import('../data/products').Product[]} items
 * @param {'default' | 'price_asc' | 'price_desc' | 'name'} sortBy
 */
export function sortCatalogProducts(items, sortBy) {
  const copy = [...items]
  switch (sortBy) {
    case 'price_asc':
      return copy.sort((a, b) => listPrice(a) - listPrice(b))
    case 'price_desc':
      return copy.sort((a, b) => listPrice(b) - listPrice(a))
    case 'name':
      return copy.sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''), 'vi', {
          sensitivity: 'base',
        }),
      )
    case 'default':
      /** Giữ thứ tự từ BE / caller — không sort. */
      return copy
    default:
      return copy
  }
}
