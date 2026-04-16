/**
 * Chuẩn hoá response danh sách đơn từ BE (mảng thuần hoặc { orders, total } / { items, count }).
 */
export function parseOrderListResponse(data) {
  if (Array.isArray(data)) {
    return { items: data, total: null }
  }
  const items = Array.isArray(data?.orders)
    ? data.orders
    : Array.isArray(data?.items)
      ? data.items
      : []
  let total = null
  if (typeof data?.total === 'number' && Number.isFinite(data.total)) {
    total = data.total
  } else if (typeof data?.count === 'number' && Number.isFinite(data.count)) {
    total = data.count
  }
  return { items, total }
}
