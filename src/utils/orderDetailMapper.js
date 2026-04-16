import { normalizeOrderStatus } from './../constants/orderStatus'
import { normalizeOrderDelivery } from './orderDelivery'

function pickItemImage(item) {
  const candidates = [
    item?.thumbnail,
    item?.variant?.images?.[0],
    item?.product?.images?.[0],
  ]
  return candidates.find((v) => typeof v === 'string' && v.trim()) || ''
}

function buildShippingAddressText(order) {
  if (order?.shippingAddressText) return order.shippingAddressText
  const addr = order?.shippingAddress
  if (!addr) return ''
  const parts = [addr.detail, addr.ward, addr.district, addr.province]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
  return parts.join(', ')
}

export function mapOrderDetail(raw) {
  const items = Array.isArray(raw?.items) ? raw.items : []
  const shippingNote = raw?.shippingAddress?.note || ''
  const cancelReason = raw?.note || ''
  return {
    ...raw,
    status: normalizeOrderStatus(raw?.status),
    delivery: normalizeOrderDelivery(raw),
    shippingAddressText: buildShippingAddressText(raw),
    shippingNote,
    cancelReason,
    items: items.map((item) => ({
      ...item,
      image: pickItemImage(item),
      displayName: item?.name || item?.product?.name || 'Sản phẩm',
      variantLabel: item?.variantLabel || '',
      lineTotal: Number(item?.price || 0) * Number(item?.quantity || 0),
    })),
  }
}
