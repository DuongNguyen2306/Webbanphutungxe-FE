export const VEHICLE_TYPES = [
  { id: 'underbone', label: 'Xe số / Underbone' },
  { id: 'scooter', label: 'Tay ga / Scooter' },
  { id: 'sportbike', label: 'Sport / PKL' },
]

export const PART_TYPES = [
  { id: 'shock', label: 'Giảm xóc' },
  { id: 'lighting', label: 'Đèn & điện' },
  { id: 'tires_wheels', label: 'Vỏ & mâm' },
  { id: 'engine', label: 'Động cơ & truyền động' },
  { id: 'accessories', label: 'Phụ kiện & đồ chơi' },
]

export const BRAND_FILTER_IDS = ['vespa', 'honda', 'yamaha', 'piaggio']

/** Nhóm hãng: ưu tiên Vespa — phù hợp shop chuyên Vespa, ít hàng xe khác */
export const BRAND_FILTER_GROUPS = [
  {
    id: 'vespa-core',
    legend: 'Vespa & Piaggio',
    hint: 'Hàng chủ lực cửa hàng',
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
