/** Zalo OA / số shop — thay bằng link thật khi triển khai */
export const SHOP_ZALO_URL = 'https://zalo.me/848xxxxxxxx'

export const SHOP_INFO = {
  name: 'Thai Vũ — Phụ kiện xe máy',
  address: '123 Đường X, Phường Y, Quận Tân Bình, TP. Hồ Chí Minh',
  hotline: '0900 123 456',
  email: 'hotro@thaivu.vn',
  taxCode: '0123456789',
}

export const BRANDS = {
  all: { id: 'all', label: 'Tất cả' },
  vespa: { id: 'vespa', label: 'Vespa' },
  honda: { id: 'honda', label: 'Honda' },
  yamaha: { id: 'yamaha', label: 'Yamaha' },
  piaggio: { id: 'piaggio', label: 'Piaggio' },
}

/**
 * @typedef {Object} ProductVariant
 * @property {string} id
 * @property {string} label
 * @property {number} salePrice
 * @property {number|null} originalPrice
 * @property {boolean} available
 * @property {string} [image]
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {number|null} originalPrice
 * @property {number} salePrice
 * @property {string|null} discountTag
 * @property {string} image
 * @property {string[]} images
 * @property {boolean} isAvailable
 * @property {'vespa'|'honda'|'yamaha'|'piaggio'} brand
 * @property {'underbone'|'scooter'|'sportbike'} vehicleType
 * @property {'shock'|'lighting'|'tires_wheels'|'engine'|'accessories'} partCategory
 * @property {boolean} [priceFrom]
 * @property {'replacement'|'tires'|null} [homeFeature]
 * @property {number} rating
 * @property {number} reviewCount
 * @property {number} soldCount
 * @property {ProductVariant[]} variants
 */

function imgs(primary, ...alts) {
  const base = [primary, ...(alts.length ? alts : [])]
  const out = [...base]
  while (out.length < 4) out.push(primary)
  return out.slice(0, 5)
}

/** @type {Product[]} */
export const products = [
  {
    id: '1',
    name: 'Gương gù CRG — Honda Winner / Sonic',
    originalPrice: 450000,
    salePrice: 320000,
    discountTag: '-29%',
    image:
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1558981039-3f7538e0af3c?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&h=800&fit=crop',
    ),
    isAvailable: true,
    brand: 'honda',
    vehicleType: 'underbone',
    partCategory: 'accessories',
    priceFrom: true,
    homeFeature: null,
    rating: 4.7,
    reviewCount: 3720,
    soldCount: 20500,
    variants: [
      {
        id: 'v1',
        label: 'Đen carbon',
        salePrice: 320000,
        originalPrice: 450000,
        available: true,
      },
      {
        id: 'v2',
        label: 'Titan xám',
        salePrice: 340000,
        originalPrice: 470000,
        available: true,
      },
      {
        id: 'v3',
        label: 'Chrome',
        salePrice: 360000,
        originalPrice: 490000,
        available: false,
      },
    ],
  },
  {
    id: '2',
    name: 'Đèn pha LED 2 tầng Vision 2021+',
    originalPrice: 1890000,
    salePrice: 1490000,
    discountTag: '-21%',
    image:
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1628527304949-517437b65a56?w=800&h=800&fit=crop',
    ),
    isAvailable: true,
    brand: 'honda',
    vehicleType: 'scooter',
    partCategory: 'lighting',
    homeFeature: 'replacement',
    rating: 4.8,
    reviewCount: 890,
    soldCount: 4200,
    variants: [
      {
        id: 'v1',
        label: 'Trắng tuyết',
        salePrice: 1490000,
        originalPrice: 1890000,
        available: true,
      },
      {
        id: 'v2',
        label: 'Đen mờ',
        salePrice: 1520000,
        originalPrice: 1920000,
        available: true,
      },
    ],
  },
  {
    id: '3',
    name: 'Giảm xóc sau YSS Honda SH mode',
    originalPrice: null,
    salePrice: 2100000,
    discountTag: null,
    image:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&h=800&fit=crop',
    ),
    isAvailable: false,
    brand: 'honda',
    vehicleType: 'scooter',
    partCategory: 'shock',
    homeFeature: 'replacement',
    rating: 4.6,
    reviewCount: 210,
    soldCount: 980,
    variants: [
      {
        id: 'v1',
        label: 'Đỏ / Vàng',
        salePrice: 2100000,
        originalPrice: null,
        available: false,
      },
    ],
  },
  {
    id: '4',
    name: 'Đội đèn bi cầu Vespa Sprint / Primavera',
    originalPrice: 3200000,
    salePrice: 2790000,
    discountTag: '-13%',
    image:
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=800&h=800&fit=crop',
    ),
    isAvailable: true,
    brand: 'vespa',
    vehicleType: 'scooter',
    partCategory: 'lighting',
    homeFeature: null,
    rating: 4.9,
    reviewCount: 1560,
    soldCount: 8900,
    variants: [
      {
        id: 'v1',
        label: 'Bản LED trắng',
        salePrice: 2790000,
        originalPrice: 3200000,
        available: true,
      },
      {
        id: 'v2',
        label: 'Bản bi xenon',
        salePrice: 2990000,
        originalPrice: 3400000,
        available: true,
      },
    ],
  },
  {
    id: '5',
    name: 'Gương hậu Rizoma Vespa GTS',
    originalPrice: 890000,
    salePrice: 750000,
    discountTag: '-16%',
    image:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop',
    ),
    isAvailable: true,
    brand: 'vespa',
    vehicleType: 'scooter',
    partCategory: 'accessories',
    homeFeature: null,
    rating: 4.5,
    reviewCount: 320,
    soldCount: 2100,
    variants: [
      {
        id: 'v1',
        label: 'Đen',
        salePrice: 750000,
        originalPrice: 890000,
        available: true,
      },
    ],
  },
  {
    id: '6',
    name: 'Phuộc Ohlins Vespa — bản giới hạn',
    originalPrice: 12500000,
    salePrice: 11200000,
    discountTag: '-10%',
    image:
      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&h=800&fit=crop',
    ),
    isAvailable: true,
    brand: 'vespa',
    vehicleType: 'scooter',
    partCategory: 'shock',
    homeFeature: 'replacement',
    rating: 5,
    reviewCount: 88,
    soldCount: 320,
    variants: [
      {
        id: 'v1',
        label: 'Vàng Ohlins',
        salePrice: 11200000,
        originalPrice: 12500000,
        available: true,
      },
    ],
  },
  {
    id: '7',
    name: 'Đèn hậu LED tích hợp xi nhan Exciter 155',
    originalPrice: 650000,
    salePrice: 520000,
    discountTag: '-20%',
    image:
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=800&fit=crop',
    ),
    isAvailable: true,
    brand: 'yamaha',
    vehicleType: 'underbone',
    partCategory: 'lighting',
    homeFeature: null,
    rating: 4.6,
    reviewCount: 2100,
    soldCount: 12000,
    variants: [
      {
        id: 'v1',
        label: 'Khói',
        salePrice: 520000,
        originalPrice: 650000,
        available: true,
      },
      {
        id: 'v2',
        label: 'Đỏ đậm',
        salePrice: 520000,
        originalPrice: 650000,
        available: true,
      },
    ],
  },
  {
    id: '8',
    name: 'Gương 5 cạnh Yamaha NVX / Janus',
    originalPrice: 280000,
    salePrice: 199000,
    discountTag: '-29%',
    image:
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=800&fit=crop',
    ),
    isAvailable: true,
    brand: 'yamaha',
    vehicleType: 'scooter',
    partCategory: 'accessories',
    homeFeature: null,
    rating: 4.4,
    reviewCount: 560,
    soldCount: 7800,
    variants: [
      {
        id: 'v1',
        label: 'Đen',
        salePrice: 199000,
        originalPrice: 280000,
        available: true,
      },
    ],
  },
  {
    id: '9',
    name: 'Phuộc sau Racing Boy Yamaha NVX',
    originalPrice: 3200000,
    salePrice: 2890000,
    discountTag: '-10%',
    image:
      'https://images.unsplash.com/photo-1558981403-0b5b5e5e5b5e?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1558981403-0b5b5e5e5b5e?w=800&h=800&fit=crop',
    ),
    isAvailable: true,
    brand: 'yamaha',
    vehicleType: 'scooter',
    partCategory: 'shock',
    homeFeature: 'replacement',
    rating: 4.7,
    reviewCount: 430,
    soldCount: 1900,
    variants: [
      {
        id: 'v1',
        label: 'Đỏ / Vàng',
        salePrice: 2890000,
        originalPrice: 3200000,
        available: true,
      },
    ],
  },
  {
    id: '10',
    name: 'Ốp đèn pha carbon Honda CB150R',
    originalPrice: 420000,
    salePrice: 359000,
    discountTag: '-15%',
    image:
      'https://images.unsplash.com/photo-1628527304949-517437b65a56?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1628527304949-517437b65a56?w=800&h=800&fit=crop',
    ),
    isAvailable: true,
    brand: 'honda',
    vehicleType: 'sportbike',
    partCategory: 'accessories',
    homeFeature: null,
    rating: 4.5,
    reviewCount: 120,
    soldCount: 640,
    variants: [
      {
        id: 'v1',
        label: 'Carbon 3K',
        salePrice: 359000,
        originalPrice: 420000,
        available: true,
      },
    ],
  },
  {
    id: '11',
    name: 'Tay thắng Brembo style — Honda PCX',
    originalPrice: 1100000,
    salePrice: 990000,
    discountTag: '-10%',
    image:
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=800&fit=crop',
    ),
    isAvailable: false,
    brand: 'honda',
    vehicleType: 'scooter',
    partCategory: 'accessories',
    homeFeature: null,
    rating: 4.3,
    reviewCount: 95,
    soldCount: 410,
    variants: [
      {
        id: 'v1',
        label: 'Đen',
        salePrice: 990000,
        originalPrice: 1100000,
        available: false,
      },
    ],
  },
  {
    id: '12',
    name: 'Đèn demi 2 màu Yamaha Grande',
    originalPrice: 380000,
    salePrice: 299000,
    discountTag: '-21%',
    image:
      'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=800&h=800&fit=crop',
    ),
    isAvailable: true,
    brand: 'yamaha',
    vehicleType: 'scooter',
    partCategory: 'lighting',
    homeFeature: null,
    rating: 4.6,
    reviewCount: 780,
    soldCount: 5100,
    variants: [
      {
        id: 'v1',
        label: 'Trắng / xanh',
        salePrice: 299000,
        originalPrice: 380000,
        available: true,
      },
    ],
  },
  {
    id: '13',
    name: 'Vỏ Michelin City Grip 120/70-14 (Vespa)',
    originalPrice: 890000,
    salePrice: 610000,
    discountTag: '-31%',
    image:
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&h=750&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?w=800&h=1000&fit=crop',
    ),
    isAvailable: true,
    brand: 'vespa',
    vehicleType: 'scooter',
    partCategory: 'tires_wheels',
    homeFeature: 'tires',
    rating: 4.8,
    reviewCount: 2400,
    soldCount: 15000,
    variants: [
      {
        id: 'v1',
        label: '120/70-14',
        salePrice: 610000,
        originalPrice: 890000,
        available: true,
      },
      {
        id: 'v2',
        label: '130/70-13',
        salePrice: 640000,
        originalPrice: 920000,
        available: true,
      },
    ],
  },
  {
    id: '14',
    name: 'Vỏ Dunlop Scoot Smart 110/70-12',
    originalPrice: 720000,
    salePrice: 580000,
    discountTag: '-19%',
    image:
      'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?w=600&h=750&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?w=800&h=1000&fit=crop',
    ),
    isAvailable: true,
    brand: 'honda',
    vehicleType: 'scooter',
    partCategory: 'tires_wheels',
    homeFeature: 'tires',
    rating: 4.5,
    reviewCount: 670,
    soldCount: 4300,
    variants: [
      {
        id: 'v1',
        label: '110/70-12',
        salePrice: 580000,
        originalPrice: 720000,
        available: true,
      },
    ],
  },
  {
    id: '15',
    name: 'Sên vàng DID 428D 130 mắt — Winner / Exciter',
    originalPrice: 650000,
    salePrice: 530000,
    discountTag: '-18%',
    image:
      'https://images.unsplash.com/photo-1558981039-3f7538e0af3c?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1558981039-3f7538e0af3c?w=800&h=800&fit=crop',
    ),
    isAvailable: true,
    brand: 'honda',
    vehicleType: 'underbone',
    partCategory: 'engine',
    homeFeature: 'replacement',
    rating: 4.9,
    reviewCount: 3100,
    soldCount: 22000,
    variants: [
      {
        id: 'v1',
        label: '130 mắt',
        salePrice: 530000,
        originalPrice: 650000,
        available: true,
      },
    ],
  },
  {
    id: '16',
    name: 'Lọc gió K&N độ — Piaggio Medley',
    originalPrice: 520000,
    salePrice: 440000,
    discountTag: '-15%',
    image:
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=800&fit=crop',
    ),
    isAvailable: true,
    brand: 'piaggio',
    vehicleType: 'scooter',
    partCategory: 'engine',
    homeFeature: 'replacement',
    rating: 4.4,
    reviewCount: 180,
    soldCount: 920,
    variants: [
      {
        id: 'v1',
        label: 'Medley 125/150',
        salePrice: 440000,
        originalPrice: 520000,
        available: true,
      },
    ],
  },
  {
    id: '17',
    name: 'Thắng đĩa Brembo replica — Vespa GTS 300',
    originalPrice: 4200000,
    salePrice: 3890000,
    discountTag: '-7%',
    image:
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=800&fit=crop',
    ),
    isAvailable: true,
    brand: 'vespa',
    vehicleType: 'scooter',
    partCategory: 'accessories',
    homeFeature: null,
    rating: 4.7,
    reviewCount: 210,
    soldCount: 680,
    variants: [
      {
        id: 'v1',
        label: 'Đỏ',
        salePrice: 3890000,
        originalPrice: 4200000,
        available: true,
      },
      {
        id: 'v2',
        label: 'Đen',
        salePrice: 3890000,
        originalPrice: 4200000,
        available: true,
      },
    ],
  },
  {
    id: '18',
    name: 'Mâm RCB 5 cây 1.6 — Exciter 155',
    originalPrice: 5200000,
    salePrice: 4650000,
    discountTag: '-11%',
    image:
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&h=600&fit=crop',
    images: imgs(
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&h=800&fit=crop',
    ),
    isAvailable: true,
    brand: 'yamaha',
    vehicleType: 'underbone',
    partCategory: 'tires_wheels',
    homeFeature: 'tires',
    rating: 4.8,
    reviewCount: 540,
    soldCount: 2100,
    variants: [
      {
        id: 'v1',
        label: 'Đen mờ',
        salePrice: 4650000,
        originalPrice: 5200000,
        available: true,
      },
      {
        id: 'v2',
        label: 'Vàng gold',
        salePrice: 4750000,
        originalPrice: 5300000,
        available: true,
      },
    ],
  },
]

/**
 * @param {string} id
 * @returns {Product|undefined}
 */
export function getProductById(id) {
  return products.find((p) => p.id === String(id))
}
