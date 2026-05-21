/** Tùy chọn sắp xếp catalog — dùng sidebar desktop (đủ) và thanh mobile (rút gọn). */
export const CATALOG_SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'name', label: 'Tên A → Z' },
]

/** Chỉ 3 lựa chọn trên thanh Filter Bar mobile. */
export const CATALOG_MOBILE_SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
]

export function getCatalogSortLabel(value, options = CATALOG_SORT_OPTIONS) {
  return options.find((o) => o.value === value)?.label ?? 'Mặc định'
}
