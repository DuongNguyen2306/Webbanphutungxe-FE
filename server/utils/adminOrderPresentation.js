import mongoose from 'mongoose'
import { Product } from '../models/Product.js'
import { formatAddressText } from './orderPresentation.js'
import { resolveStatusHistory } from './orderStatusHistory.js'

export const ADMIN_STATUS_OPTIONS = [
  { code: 'PENDING', label: 'Chờ xử lý' },
  { code: 'CONTACTING', label: 'Đang liên hệ' },
  { code: 'CONFIRMED', label: 'Đã xác nhận' },
  { code: 'SHIPPING', label: 'Đang giao' },
  { code: 'COMPLETED', label: 'Hoàn thành' },
  { code: 'CANCELLED', label: 'Đã hủy' },
]

const DB_STATUSES = new Set([
  'pending',
  'contacting',
  'confirmed',
  'shipping',
  'completed',
  'cancelled',
])

const STATUS_FILTER_MAP = {
  pending: ['pending'],
  contacting: ['contacting'],
  confirmed: ['confirmed'],
  shipping: ['shipping'],
  completed: ['completed'],
  cancelled: ['cancelled'],
  'chờ xử lý': ['pending'],
  'đang liên hệ': ['contacting'],
  'đã xác nhận': ['confirmed'],
  'đang giao': ['shipping'],
  'hoàn thành': ['completed'],
  'đã hủy': ['cancelled'],
  'chờ xác nhận': ['pending', 'contacting'],
  'chờ lấy hàng': ['confirmed'],
  'đã giao': ['completed'],
  hủy: ['cancelled'],
}

export function presentDbStatus(dbStatus) {
  const s = String(dbStatus || '').toLowerCase()
  const row = ADMIN_STATUS_OPTIONS.find(
    (opt) => opt.code === String(dbStatus || '').toUpperCase(),
  )
  if (row) return { status: row.code, statusLabel: row.label }
  const map = {
    pending: ADMIN_STATUS_OPTIONS[0],
    contacting: ADMIN_STATUS_OPTIONS[1],
    confirmed: ADMIN_STATUS_OPTIONS[2],
    shipping: ADMIN_STATUS_OPTIONS[3],
    completed: ADMIN_STATUS_OPTIONS[4],
    cancelled: ADMIN_STATUS_OPTIONS[5],
  }
  const hit = map[s]
  if (hit) return { status: hit.code, statusLabel: hit.label }
  return { status: 'PENDING', statusLabel: 'Chờ xử lý' }
}

/** Body status (code hoặc alias lowercase) → giá trị lưu DB. */
export function parseStatusInput(raw) {
  const s = String(raw || '').trim().toLowerCase()
  if (!s) return null
  const aliases = {
    pending: 'pending',
    contacting: 'contacting',
    confirmed: 'confirmed',
    shipping: 'shipping',
    completed: 'completed',
    cancelled: 'cancelled',
  }
  return aliases[s] || null
}

export function resolveStatusFilter(queryStatus) {
  const raw = String(queryStatus || '').trim()
  if (!raw) return null
  const lower = raw.toLowerCase()
  if (STATUS_FILTER_MAP[lower]) return STATUS_FILTER_MAP[lower]
  const parsed = parseStatusInput(raw)
  if (parsed) return [parsed]
  return null
}

export function parseProcessedByInput(body) {
  const raw =
    body?.processedBy !== undefined && body?.processedBy !== null
      ? body.processedBy
      : body?.employeeName
  if (raw === undefined || raw === null) return undefined
  const trimmed = String(raw).trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, 120)
}

async function enrichItems(items) {
  const productIds = [
    ...new Set((items || []).map((i) => String(i.productId)).filter(Boolean)),
  ]
  const products = productIds.length
    ? await Product.find({
        _id: {
          $in: productIds.filter((id) => mongoose.Types.ObjectId.isValid(id)),
        },
      }).lean()
    : []
  const byId = new Map(products.map((p) => [String(p._id), p]))

  return (items || []).map((item) => {
    const product = byId.get(String(item.productId))
    const variant = product?.variants?.find(
      (v) => String(v._id) === String(item.variantId),
    )
    const thumbnail =
      (variant?.images || []).find(Boolean) ||
      (product?.images || []).find(Boolean) ||
      ''
    return {
      ...item,
      productId: String(item.productId),
      variantId: String(item.variantId),
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
              images: variant.images || [],
            },
          }
        : {}),
    }
  })
}

export async function presentAdminOrder(lean, { enrich = true } = {}) {
  const items = enrich ? await enrichItems(lean.items || []) : lean.items || []
  const { status, statusLabel } = presentDbStatus(lean.status)
  const shippingAddressText = formatAddressText(lean.shippingAddress)
  const delivery = lean.delivery || {}
  const processedBy =
    lean.processedBy != null && String(lean.processedBy).trim()
      ? String(lean.processedBy).trim()
      : null

  return {
    _id: lean._id,
    orderId: String(lean._id),
    orderCode: lean.orderCode || null,
    user: lean.user || null,
    contact: lean.contact || { name: '', email: '', phone: '' },
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
    shippingFee: Number(lean.shippingFee) || 0,
    status,
    statusLabel,
    processedBy,
    cancelNote: lean.cancelNote || '',
    note: lean.cancelNote || '',
    delivery: {
      carrierName: String(delivery.carrierName || '').trim(),
      trackingNumber: String(delivery.trackingNumber || '').trim(),
    },
    createdAt: lean.createdAt,
    updatedAt: lean.updatedAt,
    statusHistory: resolveStatusHistory(lean),
  }
}

export function isValidDbStatus(status) {
  return DB_STATUSES.has(status)
}
