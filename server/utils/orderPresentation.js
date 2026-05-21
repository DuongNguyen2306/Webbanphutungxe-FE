import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'

export function formatAddressText(shippingAddress) {
  if (!shippingAddress) return ''
  const parts = [
    shippingAddress.detail,
    shippingAddress.ward,
    shippingAddress.district,
    shippingAddress.province,
  ]
    .map((x) => String(x || '').trim())
    .filter(Boolean)
  return parts.join(', ')
}

export function presentOrderStatus(dbStatus) {
  const s = String(dbStatus || '').toLowerCase()
  const map = {
    pending: { status: 'PENDING', statusLabel: 'Chờ xử lý' },
    contacting: { status: 'CONTACTING', statusLabel: 'Đang liên hệ' },
    confirmed: { status: 'CONFIRMED', statusLabel: 'Đã xác nhận' },
    shipping: { status: 'SHIPPING', statusLabel: 'Đang giao' },
    completed: { status: 'COMPLETED', statusLabel: 'Hoàn thành' },
    cancelled: { status: 'CANCELLED', statusLabel: 'Đã hủy' },
  }
  return map[s] || map.pending
}

export async function generateUniqueOrderCode() {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const exists = await Order.exists({ orderCode: code })
    if (!exists) return code
  }
  throw new Error('Không tạo được mã đơn hàng.')
}

async function enrichOrderItems(items) {
  const productIds = [...new Set(items.map((i) => String(i.productId)))]
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } }).lean()
    : []
  const byId = new Map(products.map((p) => [String(p._id), p]))

  return items.map((item) => {
    const product = byId.get(String(item.productId))
    const variant = product?.variants?.find(
      (v) => String(v._id) === String(item.variantId),
    )
    const thumbnail =
      (variant?.images || []).find(Boolean) ||
      (product?.images || []).find(Boolean) ||
      ''
    const variantParts = [variant?.typeName, variant?.color, variant?.size]
      .map((x) => String(x || '').trim())
      .filter(Boolean)

    return {
      productId: String(item.productId),
      variantId: String(item.variantId),
      name: item.name,
      variantLabel: item.variantLabel ?? '',
      quantity: item.quantity,
      price: item.price,
      lineTotal: Number(item.price) * Number(item.quantity),
      thumbnail,
      ...(product
        ? {
            product: {
              _id: product._id,
              name: product.name,
              images: product.images || [],
            },
          }
        : {}),
      ...(variant
        ? {
            variant: {
              _id: variant._id,
              typeName: variant.typeName || '',
              color: variant.color || '',
              size: variant.size || '',
              price: variant.price,
              images: variant.images || [],
              displayKey: variantParts.join(' / ') || item.variantLabel || '',
            },
          }
        : {}),
    }
  })
}

/** Payload `order` trong response POST /api/orders (201). */
export async function buildOrderConfirmationPayload(orderDoc) {
  const lean = orderDoc?.toObject ? orderDoc.toObject() : { ...orderDoc }
  const items = await enrichOrderItems(lean.items || [])
  const shippingAddressText = formatAddressText(lean.shippingAddress)
  const { status, statusLabel } = presentOrderStatus(lean.status)
  const shippingFee = Number(lean.shippingFee) || 0

  return {
    _id: lean._id,
    orderId: String(lean._id),
    orderCode: lean.orderCode || '',
    contact: {
      name: lean.contact?.name || '',
      email: lean.contact?.email || '',
      phone: lean.contact?.phone || '',
    },
    shippingAddress: lean.shippingAddress || {
      province: '',
      district: '',
      ward: '',
      detail: '',
      note: '',
    },
    shippingAddressText,
    items,
    totalAmount: lean.totalAmount,
    shippingFee,
    status,
    statusLabel,
    createdAt: lean.createdAt,
    updatedAt: lean.updatedAt,
  }
}
