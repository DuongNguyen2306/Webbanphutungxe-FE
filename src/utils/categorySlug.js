/** Slug danh mục (đồng bộ query ?category=). */
export function slugifyCategoryName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const HANG_MOI_VE_NORM = 'hang moi ve'
const HANG_CHINH_HANG_NORM = 'hang chinh hang'

function normalizeCategoryComparable(name) {
  return String(name || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function isHangMoiVeCategoryName(name) {
  return normalizeCategoryComparable(name) === HANG_MOI_VE_NORM
}

/** Danh mục marketing cũ — không hiện menu (dùng block new-arrivals thay thế). */
export function isHangChinhHangCategoryName(name) {
  return normalizeCategoryComparable(name) === HANG_CHINH_HANG_NORM
}

export function isExcludedStorefrontCategoryName(name) {
  return isHangMoiVeCategoryName(name) || isHangChinhHangCategoryName(name)
}

/** Lọc copy banner / mô tả có cụm «Hàng chính hãng». */
export function textMentionsHangChinhHang(text) {
  return normalizeCategoryComparable(text).includes(HANG_CHINH_HANG_NORM)
}
