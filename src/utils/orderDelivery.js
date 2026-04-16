import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus'

/** Trạng thái cho phép admin PATCH /api/admin/orders/:id/delivery */
const ADMIN_DELIVERY_EDITABLE = new Set([
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.SHIPPING,
  ORDER_STATUS.COMPLETED,
])

export function canAdminEditOrderDelivery(status) {
  return ADMIN_DELIVERY_EDITABLE.has(normalizeOrderStatus(status))
}

/** Chuẩn hoá object delivery từ API (đơn cũ có thể thiếu hoặc rỗng). */
export function normalizeOrderDelivery(raw) {
  const d = raw?.delivery
  if (!d || typeof d !== 'object') {
    return { carrierName: '', trackingNumber: '' }
  }
  return {
    carrierName: String(d.carrierName ?? '').trim(),
    trackingNumber: String(d.trackingNumber ?? '').trim(),
  }
}
