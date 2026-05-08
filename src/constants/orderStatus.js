export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONTACTING: 'CONTACTING',
  CONFIRMED: 'CONFIRMED',
  SHIPPING: 'SHIPPING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Chờ xử lý',
  [ORDER_STATUS.CONTACTING]: 'Đang liên hệ',
  [ORDER_STATUS.CONFIRMED]: 'Đã xác nhận',
  [ORDER_STATUS.SHIPPING]: 'Đang giao',
  [ORDER_STATUS.COMPLETED]: 'Hoàn thành',
  [ORDER_STATUS.CANCELLED]: 'Đã hủy',
}

/** Tailwind classes for list/card status pills (single source for admin + customer). */
export const ORDER_STATUS_BADGE_CLASSES = {
  [ORDER_STATUS.PENDING]: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
  [ORDER_STATUS.CONTACTING]: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
  [ORDER_STATUS.CONFIRMED]: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200/80',
  [ORDER_STATUS.SHIPPING]: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/80',
  [ORDER_STATUS.COMPLETED]: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
  [ORDER_STATUS.CANCELLED]: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80',
}

export const FALLBACK_STATUS_OPTIONS = Object.values(ORDER_STATUS).map((code) => ({
  code,
  label: ORDER_STATUS_LABELS[code] || code,
}))

export function isOrderStatusCode(status) {
  return Boolean(ORDER_STATUS_LABELS[String(status || '').toUpperCase()])
}

const LEGACY_STATUS_MAP = {
  pending: ORDER_STATUS.PENDING,
  contacting: ORDER_STATUS.CONTACTING,
  confirmed: ORDER_STATUS.CONFIRMED,
  shipping: ORDER_STATUS.SHIPPING,
  completed: ORDER_STATUS.COMPLETED,
  cancelled: ORDER_STATUS.CANCELLED,
}

export function normalizeOrderStatus(status, fallback = ORDER_STATUS.PENDING) {
  if (!status) return fallback
  const upper = String(status).toUpperCase()
  if (ORDER_STATUS_LABELS[upper]) return upper
  return LEGACY_STATUS_MAP[String(status)] || fallback
}

export const ORDER_STATUS_TAB = {
  ALL: 'all',
  PENDING: ORDER_STATUS.PENDING,
  CONTACTING: ORDER_STATUS.CONTACTING,
  CONFIRMED: ORDER_STATUS.CONFIRMED,
  SHIPPING: ORDER_STATUS.SHIPPING,
  COMPLETED: ORDER_STATUS.COMPLETED,
  CANCELLED: ORDER_STATUS.CANCELLED,
}

export function mapOrderTabToStatusCode(tabId) {
  if (!tabId || tabId === ORDER_STATUS_TAB.ALL) return ''
  return isOrderStatusCode(tabId) ? String(tabId).toUpperCase() : ''
}
