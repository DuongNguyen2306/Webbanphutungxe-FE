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

/** Tối thiểu 0 để SP giá thấp / 0đ (mặc định biến thể) không bị lọc mất */
export const PRICE_SLIDER_MIN = 0
export const PRICE_SLIDER_MAX = 5_000_000

export function createDefaultFilterState() {
  return {
    brands: [],
    vehicles: [],
    parts: [],
    priceMin: PRICE_SLIDER_MIN,
    priceMax: PRICE_SLIDER_MAX,
    inStockOnly: false,
  }
}
