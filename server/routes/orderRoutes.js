import express from 'express'
import mongoose from 'mongoose'
import { authOptional, authRequired } from '../middleware/auth.js'
import { Order } from '../models/Order.js'

const router = express.Router()

function formatAddressText(shippingAddress) {
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

router.post('/', authOptional, async (req, res) => {
  try {
    const { contact, items, totalAmount, shippingAddress } = req.body
    if (!contact || !items?.length)
      return res.status(400).json({ message: 'Thiếu thông tin đơn hàng.' })
    const { name = '', email = '', phone = '' } = contact
    if (!String(email).trim() && !String(phone).trim())
      return res.status(400).json({ message: 'Cần email hoặc SĐT liên hệ.' })

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

    if (!province || !district || !ward || !detail) {
      return res.status(400).json({
        message:
          'Địa chỉ giao hàng không hợp lệ. Cần province, district, ward, detail.',
      })
    }

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

    const order = await Order.create({
      user: req.userId || null,
      contact: {
        name,
        email: String(email).trim(),
        phone: String(phone).trim(),
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
      status: 'contacting',
    })
    res.status(201).json({
      orderId: order._id,
      message: 'OK',
      shippingAddressText: formatAddressText(order.shippingAddress),
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
  res.json(order)
})

export default router
