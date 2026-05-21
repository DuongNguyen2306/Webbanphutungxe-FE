import { normalizeOrderStatus } from '../constants/orderStatus'
import { normalizeOrderDelivery } from './orderDelivery'
import { normalizeOrderStatusHistory } from './orderStatusHistory'

/**
 * Gộp response PATCH/GET admin order vào state hiện có.
 * @param {Record<string, unknown>} prev
 * @param {Record<string, unknown>} data
 */
export function mergeAdminOrderPatch(prev, data) {
  if (!data || typeof data !== 'object') return prev
  return {
    ...prev,
    ...data,
    status: normalizeOrderStatus(
      String(data.status || prev.status || ''),
    ),
    processedBy:
      data.processedBy !== undefined && data.processedBy !== null
        ? String(data.processedBy).trim() || null
        : prev.processedBy ?? null,
    orderCode:
      data.orderCode !== undefined ? data.orderCode : prev.orderCode,
    cancelNote: data.cancelNote ?? prev.cancelNote,
    cancelReason:
      data.note ?? data.cancelNote ?? prev.cancelReason ?? prev.cancelNote,
    delivery:
      data.delivery && typeof data.delivery === 'object'
        ? normalizeOrderDelivery({ delivery: { ...prev.delivery, ...data.delivery } })
        : prev.delivery,
    shippingAddressText:
      data.shippingAddressText ?? prev.shippingAddressText,
    statusHistory: Array.isArray(data.statusHistory)
      ? normalizeOrderStatusHistory({ statusHistory: data.statusHistory })
      : prev.statusHistory,
  }
}
