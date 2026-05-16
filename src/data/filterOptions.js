export const VEHICLE_TYPES = [
  { id: 'underbone', label: 'Xe số / Underbone' },
  { id: 'scooter', label: 'Tay ga / Scooter' },
  { id: 'sportbike', label: 'Sport / PKL' },
]

/**
 * Danh sách loại phụ tùng (partCategory) đã chuyển sang BE: GET /api/part-categories.
 * Component cần lấy qua hook `usePartCategories` — không hard-code danh sách ở FE nữa.
 */

export const BRAND_FILTER_IDS = ['vespa', 'honda', 'yamaha', 'piaggio']

/** Nhóm hãng: ưu tiên Vespa — phù hợp shop chuyên Vespa, ít hàng xe khác */
export const BRAND_FILTER_GROUPS = [
  {
    id: 'vespa-core',
    legend: 'Vespa & Piaggio',
    hint: 'Vespa & Piaggio',
    ids: ['vespa', 'piaggio'],
  },
  {
    id: 'other-bikes',
    legend: 'Xe khác (ít hàng)',
    hint: 'Chỉ bật khi cần lọc Honda / Yamaha',
    ids: ['honda', 'yamaha'],
  },
]

/** Tối thiểu 0 để SP giá thấp / 0đ (mặc định biến thể) không bị lọc mất */
export const PRICE_SLIDER_MIN = 0
export const PRICE_SLIDER_MAX = 5_000_000

export function createDefaultFilterState(absoluteMaxPrice = PRICE_SLIDER_MAX) {
  return {
    brands: [],
    vehicles: [],
    parts: [],
    priceMin: PRICE_SLIDER_MIN,
    priceMax: absoluteMaxPrice,
    inStockOnly: false,
  }
}
