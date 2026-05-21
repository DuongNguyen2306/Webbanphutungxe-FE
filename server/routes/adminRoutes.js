import express from 'express'
import mongoose from 'mongoose'
import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'
import { Order } from '../models/Order.js'
import { User } from '../models/User.js'
import { resolveCategory } from '../lib/categories.js'
import {
  ADMIN_STATUS_OPTIONS,
  isValidDbStatus,
  parseProcessedByInput,
  parseStatusInput,
  presentAdminOrder,
  resolveStatusFilter,
} from '../utils/adminOrderPresentation.js'
import { buildOrdersExcelBuffer } from '../utils/adminOrderExport.js'
import { createStatusChangeEntry } from '../utils/orderStatusHistory.js'

const router = express.Router()

function normalizeVariants(body) {
  let variants = body.variants
  if (!Array.isArray(variants)) variants = []
  variants = variants
    .filter((v) => v != null && v !== '' && Number(v.price) >= 0)
    .map((v) => {
      const row = {
        typeName: v.typeName != null ? String(v.typeName) : '',
        color: v.color != null ? String(v.color) : '',
        size: v.size != null ? String(v.size) : '',
        price: Number(v.price),
        originalPrice:
          v.originalPrice != null && v.originalPrice !== ''
            ? Number(v.originalPrice)
            : undefined,
        isAvailable: v.isAvailable !== false,
        images: Array.isArray(v.images)
          ? v.images.map((u) => String(u).trim()).filter(Boolean)
          : [],
      }
      if (v._id && mongoose.Types.ObjectId.isValid(String(v._id))) {
        row._id = v._id
      }
      return row
    })
  if (!variants.length) {
    const bp = Number(body.basePrice)
    variants = [
      {
        typeName: 'Mặc định',
        color: '',
        size: '',
        price: Number.isFinite(bp) ? bp : 0,
        isAvailable: true,
        images: [],
      },
    ]
  }
  return variants
}

router.get('/products', async (_req, res) => {
  const list = await Product.find().populate('category', 'name').lean()
  res.json(list)
})

router.get('/products/:id', async (req, res) => {
  const p = await Product.findById(req.params.id)
    .populate('category', 'name')
    .lean()
  if (!p) return res.status(404).json({ message: 'Không tìm thấy.' })
  res.json(p)
})

router.post('/products', async (req, res) => {
  try {
    if (!req.body.name?.trim())
      return res.status(400).json({ message: 'Tên sản phẩm là bắt buộc.' })
    const catId = await resolveCategory(req.body.category)
    const variants = normalizeVariants(req.body)
    const doc = await Product.create({
      name: req.body.name.trim(),
      slug: req.body.slug,
      category: catId,
      description: req.body.description ?? '',
      images: Array.isArray(req.body.images) ? req.body.images : [],
      brand: req.body.brand ?? 'honda',
      vehicleType: req.body.vehicleType ?? 'scooter',
      partCategory: req.body.partCategory ?? 'accessories',
      homeFeature: req.body.homeFeature || null,
      showOnStorefront: req.body.showOnStorefront !== false,
      rating: req.body.rating ?? 4.5,
      reviewCount: req.body.reviewCount ?? 0,
      soldCount: req.body.soldCount ?? 0,
      badgeTags: Array.isArray(req.body.badgeTags)
        ? req.body.badgeTags.map((t) => String(t || '').trim()).filter(Boolean)
        : [],
      newArrivalEnabled: Boolean(req.body.newArrivalEnabled ?? req.body.showInNewArrivals ?? req.body.isNewArrival),
      newArrivalOrder: Math.max(0, Number(req.body.newArrivalOrder ?? req.body.newArrivalRank ?? req.body.newArrivalPosition) || 0),
      bestSellerEnabled: Boolean(req.body.bestSellerEnabled ?? req.body.showInBestSellers ?? req.body.isBestSeller),
      bestSellerOrder: Math.max(0, Number(req.body.bestSellerOrder ?? req.body.bestSellerRank ?? req.body.bestSellerPosition) || 0),
      variants,
    })
    const populated = await doc.populate('category', 'name')
    res.status(201).json(populated)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Không tạo được sản phẩm.' })
  }
})

router.put('/products/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id)
    if (!p) return res.status(404).json({ message: 'Không tìm thấy.' })
    if (req.body.name) p.name = String(req.body.name).trim()
    if (req.body.category != null)
      p.category = await resolveCategory(req.body.category)
    if (req.body.description != null) p.description = req.body.description
    if (Array.isArray(req.body.images)) p.images = req.body.images
    if (req.body.brand != null) p.brand = req.body.brand
    if (req.body.vehicleType != null) p.vehicleType = req.body.vehicleType
    if (req.body.partCategory != null) p.partCategory = req.body.partCategory
    if (req.body.homeFeature !== undefined) p.homeFeature = req.body.homeFeature
    if (req.body.showOnStorefront !== undefined)
      p.showOnStorefront = Boolean(req.body.showOnStorefront)
    if (Array.isArray(req.body.badgeTags))
      p.badgeTags = req.body.badgeTags.map((t) => String(t || '').trim()).filter(Boolean)
    if (req.body.newArrivalEnabled !== undefined)
      p.newArrivalEnabled = Boolean(req.body.newArrivalEnabled ?? req.body.showInNewArrivals ?? req.body.isNewArrival)
    if (req.body.newArrivalOrder !== undefined || req.body.newArrivalRank !== undefined || req.body.newArrivalPosition !== undefined)
      p.newArrivalOrder = Math.max(0, Number(req.body.newArrivalOrder ?? req.body.newArrivalRank ?? req.body.newArrivalPosition) || 0)
    if (req.body.bestSellerEnabled !== undefined)
      p.bestSellerEnabled = Boolean(req.body.bestSellerEnabled ?? req.body.showInBestSellers ?? req.body.isBestSeller)
    if (req.body.bestSellerOrder !== undefined || req.body.bestSellerRank !== undefined || req.body.bestSellerPosition !== undefined)
      p.bestSellerOrder = Math.max(0, Number(req.body.bestSellerOrder ?? req.body.bestSellerRank ?? req.body.bestSellerPosition) || 0)
    if (req.body.soldCount !== undefined) p.soldCount = Math.max(0, Number(req.body.soldCount) || 0)
    if (Array.isArray(req.body.variants)) {
      p.variants = normalizeVariants({
        ...req.body,
        variants: req.body.variants,
      })
    }
    await p.save()
    const out = await Product.findById(p._id).populate('category', 'name')
    res.json(out)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Cập nhật thất bại.' })
  }
})

router.patch('/products/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id)
    if (!p) return res.status(404).json({ message: 'Không tìm thấy.' })
    if (req.body.showOnStorefront !== undefined)
      p.showOnStorefront = Boolean(req.body.showOnStorefront)
    await p.save()
    const out = await Product.findById(p._id).populate('category', 'name').lean()
    res.json(out)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Cập nhật thất bại.' })
  }
})

router.delete('/products/:id', async (req, res) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id)
    if (!p) return res.status(404).json({ message: 'Không tìm thấy.' })
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Không xóa được.' })
  }
})

router.patch(
  '/products/:productId/variants/:variantId/availability',
  async (req, res) => {
    const p = await Product.findById(req.params.productId)
    if (!p) return res.status(404).json({ message: 'Không tìm thấy SP.' })
    const v = p.variants.id(req.params.variantId)
    if (!v) return res.status(404).json({ message: 'Không tìm thấy biến thể.' })
    v.isAvailable = Boolean(req.body.isAvailable)
    await p.save()
    res.json({ ok: true, variant: v })
  },
)

router.get('/orders/status-options', (_req, res) => {
  res.json({ statuses: ADMIN_STATUS_OPTIONS })
})

router.get('/orders/export-excel', async (req, res) => {
  try {
    const result = await buildOrdersExcelBuffer(
      req.query.startDate,
      req.query.endDate,
    )
    if (result.error) {
      return res.status(400).json({ message: result.error })
    }
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    )
    res.send(result.buffer)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Không xuất được báo cáo Excel.' })
  }
})

router.get('/orders', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 500)
    const skip = Math.max(Number(req.query.skip) || 0, 0)
    const filter = {}
    const statusValues = resolveStatusFilter(req.query.status)
    if (statusValues?.length) filter.status = { $in: statusValues }

    const q = String(
      req.query.search || req.query.q || req.query.keyword || '',
    ).trim()
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [
        { orderCode: rx },
        { 'contact.name': rx },
        { 'contact.phone': rx },
        { 'contact.email': rx },
        { processedBy: rx },
        { 'items.name': rx },
      ]
      if (mongoose.Types.ObjectId.isValid(q)) {
        filter.$or.push({ _id: q })
      }
    }

    const fromRaw = String(
      req.query.dateFrom || req.query.from || req.query.startDate || '',
    ).trim()
    const toRaw = String(
      req.query.dateTo || req.query.to || req.query.endDate || '',
    ).trim()
    if (fromRaw || toRaw) {
      filter.createdAt = {}
      if (fromRaw) {
        const [y, m, d] = fromRaw.split('-').map(Number)
        if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
          filter.createdAt.$gte = new Date(y, m - 1, d, 0, 0, 0, 0)
        }
      }
      if (toRaw) {
        const [y, m, d] = toRaw.split('-').map(Number)
        if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
          filter.createdAt.$lte = new Date(y, m - 1, d, 23, 59, 59, 999)
        }
      }
      if (!Object.keys(filter.createdAt).length) delete filter.createdAt
    }

    const [total, rows] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .populate('user', 'email phone name displayName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ])

    const orders = await Promise.all(rows.map((o) => presentAdminOrder(o)))
    res.json({ orders, total })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Không tải được danh sách đơn.' })
  }
})

router.get('/orders/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Mã đơn không hợp lệ.' })
    }
    const o = await Order.findById(req.params.id)
      .populate('user', 'email phone name displayName')
      .lean()
    if (!o) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' })
    res.json(await presentAdminOrder(o))
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Không tải được chi tiết đơn.' })
  }
})

router.patch('/orders/:id/status', async (req, res) => {
  try {
    const dbStatus = parseStatusInput(req.body.status)
    if (!dbStatus || !isValidDbStatus(dbStatus)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ.' })
    }

    const note = String(req.body.note || '').trim()
    if (dbStatus === 'cancelled' && !note) {
      return res
        .status(400)
        .json({ message: 'Vui lòng nhập lý do hủy (note).' })
    }

    if (dbStatus === 'completed') {
      const existing = await Order.findById(req.params.id).select('status').lean()
      if (existing && String(existing.status).toLowerCase() !== 'shipping') {
        return res.status(400).json({
          message:
            'Chỉ được chuyển Hoàn thành khi đơn đang ở trạng thái Đang giao.',
        })
      }
    }

    const processedBy = parseProcessedByInput(req.body)
    if (dbStatus !== 'cancelled' && !processedBy) {
      return res
        .status(400)
        .json({ message: 'Vui lòng nhập nhân viên xử lý (processedBy).' })
    }

    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn.' })

    const prevStatus = String(order.status || '').toLowerCase()
    if (prevStatus === dbStatus) {
      return res.status(400).json({ message: 'Trạng thái đơn không thay đổi.' })
    }

    order.status = dbStatus
    if (dbStatus === 'cancelled') {
      order.cancelNote = note
    } else {
      order.cancelNote = ''
    }
    if (processedBy !== undefined) {
      order.processedBy = processedBy
    }

    if (!Array.isArray(order.statusHistory)) order.statusHistory = []
    order.statusHistory.push(
      createStatusChangeEntry({
        fromStatus: prevStatus,
        toStatus: dbStatus,
        processedBy: processedBy ?? order.processedBy ?? null,
        note: dbStatus === 'cancelled' ? note : '',
      }),
    )

    await order.save()

    const o = await Order.findById(order._id)
      .populate('user', 'email phone name displayName')
      .lean()

    res.json(await presentAdminOrder(o))
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Cập nhật trạng thái thất bại.' })
  }
})

router.patch('/orders/:id/delivery', async (req, res) => {
  try {
    const o = await Order.findById(req.params.id)
    if (!o) return res.status(404).json({ message: 'Không tìm thấy đơn.' })

    const allowed = new Set(['confirmed', 'shipping', 'completed'])
    if (!allowed.has(String(o.status).toLowerCase())) {
      return res.status(400).json({
        message:
          'Chỉ cập nhật vận chuyển khi đơn ở trạng thái Đã xác nhận, Đang giao hoặc Hoàn thành.',
      })
    }

    if (!o.delivery) o.delivery = {}
    if (req.body.carrierName !== undefined) {
      o.delivery.carrierName = String(req.body.carrierName || '').trim()
    }
    if (req.body.trackingNumber !== undefined) {
      o.delivery.trackingNumber = String(req.body.trackingNumber || '').trim()
    }
    await o.save()

    const lean = await Order.findById(o._id)
      .populate('user', 'email phone name displayName')
      .lean()
    res.json(await presentAdminOrder(lean))
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Không lưu được thông tin vận chuyển.' })
  }
})

router.get('/users', async (_req, res) => {
  const users = await User.find()
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .lean()
  res.json(users)
})

router.get('/categories', async (_req, res) => {
  const list = await Category.find().sort({ name: 1 }).lean()
  res.json(list)
})

export default router
