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
