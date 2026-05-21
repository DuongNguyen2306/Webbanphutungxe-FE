/** Item trong `order` trả về từ POST /api/orders (201). */
export interface OrderConfirmationItem {
  productId: string
  variantId: string
  name: string
  variantLabel?: string
  quantity: number
  price: number
  lineTotal: number
  thumbnail?: string
  product?: {
    _id: string
    name: string
    images?: string[]
  }
  variant?: {
    _id: string
    key?: string
    displayKey?: string
    typeName?: string
    color?: string
    size?: string
    price?: number
    images?: string[]
  }
}

export interface OrderConfirmationContact {
  name: string
  email?: string
  phone: string
}

export interface OrderConfirmationAddress {
  province?: string
  district?: string
  ward?: string
  detail?: string
  note?: string
}

/** Object `order` dùng cho trang /order/success — không GET thêm cho guest. */
export interface OrderConfirmation {
  _id: string
  orderId: string
  orderCode: string
  contact: OrderConfirmationContact
  shippingAddress: OrderConfirmationAddress
  shippingAddressText: string
  items: OrderConfirmationItem[]
  totalAmount: number
  shippingFee: number
  status: string
  statusLabel: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateOrderResponse {
  message: string
  shippingFee: number
  orderId: string
  orderCode: string
  order: OrderConfirmation
}
