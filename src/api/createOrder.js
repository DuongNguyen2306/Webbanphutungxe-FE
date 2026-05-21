import { api } from './client'

/**
 * @typedef {import('../types/orderConfirmation').CreateOrderResponse} CreateOrderResponse
 */

/**
 * @param {{
 *   contact: { name: string, phone: string, email?: string },
 *   shippingAddress?: Record<string, string>,
 *   items: Array<{ productId: string, variantId: string, name: string, variantLabel?: string, quantity: number, price: number }>,
 *   totalAmount: number,
 * }} payload
 * @returns {Promise<CreateOrderResponse>}
 */
export async function createOrder(payload) {
  const { data } = await api.post('/api/orders', payload)
  if (!data?.order) {
    throw new Error(
      typeof data?.message === 'string' && data.message.trim()
        ? data.message
        : 'Đơn hàng đã tạo nhưng thiếu dữ liệu xác nhận.',
    )
  }
  return {
    message:
      typeof data.message === 'string' && data.message.trim()
        ? data.message.trim()
        : 'Đã nhận đơn. Nhân viên sẽ liên hệ tư vấn qua SĐT trên.',
    shippingFee: Number(data.shippingFee) || 0,
    orderId: String(data.orderId || data.order?.orderId || data.order?._id || ''),
    orderCode: String(data.orderCode || data.order?.orderCode || ''),
    order: data.order,
  }
}
