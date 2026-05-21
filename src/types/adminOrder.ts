/** Đơn hàng trả về từ GET/PATCH admin orders. */
export interface AdminOrderContact {
  name?: string
  email?: string
  phone?: string
}

export interface AdminOrderShippingAddress {
  province?: string
  district?: string
  ward?: string
  detail?: string
  note?: string
}

export interface AdminOrderDelivery {
  carrierName?: string
  trackingNumber?: string
}

export interface AdminOrderStatusHistoryItem {
  at: string | Date
  fromStatusLabel: string
  toStatusLabel: string
  processedBy?: string | null
  note?: string
  isLegacy?: boolean
}

export interface AdminOrderListItem {
  _id: string
  orderId?: string
  orderCode?: string | null
  contact?: AdminOrderContact
  shippingAddress?: AdminOrderShippingAddress
  shippingAddressText?: string
  totalAmount?: number
  shippingFee?: number
  status?: string
  statusLabel?: string
  processedBy?: string | null
  statusHistory?: AdminOrderStatusHistoryItem[]
  cancelNote?: string
  note?: string
  delivery?: AdminOrderDelivery
  items?: unknown[]
  createdAt?: string
  updatedAt?: string
  user?: { email?: string; phone?: string; _id?: string } | null
}

export interface AdminOrderStatusOption {
  code: string
  label: string
}
