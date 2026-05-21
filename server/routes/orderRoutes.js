import express from 'express'
import mongoose from 'mongoose'
import { authOptional, authRequired } from '../middleware/auth.js'
import { Order } from '../models/Order.js'
import {
  buildOrderConfirmationPayload,
  formatAddressText,
  generateUniqueOrderCode,
} from '../utils/orderPresentation.js'
import { createInitialStatusHistoryEntry } from '../utils/orderStatusHistory.js'

const router = express.Router()

const ORDER_OK_MESSAGE =
  'Đã nhận đơn. Nhân viên sẽ liên hệ tư vấn qua SĐT trên.'

router.post('/', authOptional, async (req, res) => {
  try {
    const { contact, items, totalAmount, shippingAddress } = req.body
    if (!contact || !items?.length)
      return res.status(400).json({ message: 'Thiếu thông tin đơn hàng.' })
    const name = String(contact?.name ?? req.body?.name ?? '').trim()
    const phoneRaw = contact?.phone ?? contact?.phoneNumber ?? req.body?.phoneNumber ?? ''
    const phone = String(phoneRaw).replace(/\D/g, '')
    const email = String(contact?.email ?? req.body?.email ?? '').trim()

    if (!name) return res.status(400).json({ message: 'Vui lòng nhập họ và tên.' })
    if (phone.length < 9 || phone.length > 11) {
      return res.status(400).json({ message: 'Vui lòng nhập số điện thoại hợp lệ.' })
    }

    const province = String(
      shippingAddress?.province ?? shippingAddress?.provinceName ?? '',
    ).trim()
    const district = String(
      shippingAddress?.district ?? shippingAddress?.districtName ?? '',
    ).trim()
    const ward = String(shippingAddress?.ward ?? shippingAddress?.wardName ?? '').trim()
    const detail = String(shippingAddress?.detail ?? '').trim()
    const note = String(
      shippingAddress?.note ?? req.body?.note ?? '',
    ).trim()

    const normalized = items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      name: i.name,
      variantLabel: i.variantLabel ?? '',
      quantity: Number(i.quantity),
      price: Number(i.price),
    }))

    for (const i of normalized) {
      if (
        !mongoose.isValidObjectId(i.productId) ||
        !mongoose.isValidObjectId(i.variantId)
      )
        return res.status(400).json({ message: 'Sản phẩm không hợp lệ.' })
      if (!i.quantity || i.quantity < 1 || Number.isNaN(i.price) || i.price < 0)
        return res.status(400).json({ message: 'Dòng hàng không hợp lệ.' })
    }

    const sum = normalized.reduce((s, x) => s + x.price * x.quantity, 0)
    if (Math.abs(sum - Number(totalAmount)) > 1)
      return res.status(400).json({ message: 'Tổng tiền không khớp.' })

    const orderCode = await generateUniqueOrderCode()
    const initialStatus = 'contacting'

    const order = await Order.create({
      user: req.userId || null,
      orderCode,
      contact: {
        name,
        email,
        phone,
      },
      items: normalized,
      shippingAddress: {
        province,
        district,
        ward,
        detail,
        note,
      },
      totalAmount: sum,
      shippingFee: 0,
      status: initialStatus,
      statusHistory: [createInitialStatusHistoryEntry(initialStatus)],
    })

    const orderPayload = await buildOrderConfirmationPayload(order)

    res.status(201).json({
      message: ORDER_OK_MESSAGE,
      shippingFee: 0,
      orderId: String(order._id),
      orderCode: order.orderCode,
      order: orderPayload,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Không tạo được đơn hàng.' })
  }
})

router.get('/my', authRequired, async (req, res) => {
  const list = await Order.find({ user: req.userId })
    .sort({ createdAt: -1 })
    .lean()
  res.json(
    list.map((o) => ({
      ...o,
      shippingAddressText: formatAddressText(o.shippingAddress),
    })),
  )
})

router.patch('/:id/cancel', authRequired, async (req, res) => {
  const reason = String(req.body.reason || '').trim()
  if (!reason)
    return res.status(400).json({ message: 'Vui lòng nhập lý do hủy đơn.' })

  const order = await Order.findOne({ _id: req.params.id, user: req.userId })
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' })

  if (!['pending', 'contacting'].includes(order.status)) {
    return res
      .status(400)
      .json({ message: 'Đơn hàng không thể hủy ở trạng thái hiện tại.' })
  }

  order.status = 'cancelled'
  order.cancelNote = reason
  await order.save()
  res.json({ message: 'Đã hủy đơn hàng.' })
})

export default router
