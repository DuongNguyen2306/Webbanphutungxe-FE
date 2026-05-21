const STORAGE_KEY = 'lastOrderConfirmation'
const TTL_MS = 24 * 60 * 60 * 1000

/**
 * @param {import('../types/orderConfirmation').CreateOrderResponse} payload
 */
export function saveOrderConfirmation(payload) {
  if (!payload?.order) return
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        message: payload.message,
        shippingFee: payload.shippingFee,
        orderId: payload.orderId,
        orderCode: payload.orderCode,
        order: payload.order,
      }),
    )
  } catch {
    /* quota / private mode */
  }
}

/**
 * @returns {import('../types/orderConfirmation').CreateOrderResponse | null}
 */
export function loadOrderConfirmation() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.order) return null
    if (Date.now() - Number(parsed.savedAt || 0) > TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return {
      message: parsed.message,
      shippingFee: parsed.shippingFee ?? 0,
      orderId: parsed.orderId,
      orderCode: parsed.orderCode,
      order: parsed.order,
    }
  } catch {
    return null
  }
}

export function clearOrderConfirmation() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
