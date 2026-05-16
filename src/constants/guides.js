export const PURCHASE_GUIDE_ID = '__purchase_guide__'

/** Link footer / menu → trang hướng dẫn đặt hàng (4 bước). */
export const PURCHASE_GUIDE_HREF = '/huong-dan?mua-hang=1'

export function isPurchaseGuideQuery(searchParams) {
  const v = String(searchParams?.get('mua-hang') || '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}
