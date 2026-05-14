/**
 * Chuẩn hoá tên danh mục từ API (tránh "[object Object]" khi name là object i18n hoặc dữ liệu lỗi).
 * @param {unknown} raw
 * @returns {string}
 */
export function coerceCategoryName(raw) {
  if (typeof raw === 'string') {
    const s = raw.trim()
    return s && s !== '[object Object]' ? s : ''
  }
  if (raw != null && typeof raw === 'object') {
    const nested = raw.vi ?? raw.en ?? raw.default ?? raw.label
    if (typeof nested === 'string') {
      const s = nested.trim()
      return s && s !== '[object Object]' ? s : ''
    }
  }
  return ''
}

/**
 * @param {unknown} item — document Category từ GET /api/categories
 * @returns {{ id: string, name: string } | null}
 */
export function normalizeCategoryRow(item) {
  const id = String(item?._id ?? item?.id ?? '').trim()
  let name = coerceCategoryName(item?.name)
  if (!name) name = coerceCategoryName(item?.title)
  if (!name) name = coerceCategoryName(item?.label)
  if (!id || !name) return null
  return { id, name }
}

/**
 * @param {unknown} data — body JSON từ GET /api/categories
 * @returns {{ id: string, name: string }[]}
 */
export function normalizeCategoriesPayload(data) {
  const rawList = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.categories)
        ? data.categories
        : []
  const seen = new Set()
  const out = []
  for (const item of rawList) {
    const row = normalizeCategoryRow(item)
    if (!row || seen.has(row.id)) continue
    seen.add(row.id)
    out.push(row)
  }
  out.sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }))
  return out
}
