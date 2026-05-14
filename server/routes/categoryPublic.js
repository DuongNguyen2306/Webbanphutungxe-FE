import express from 'express'
import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'

const router = express.Router()

/** Chỉ danh mục đang có ít nhất một sản phẩm hiển thị trên cửa hàng (đồng bộ với GET /api/products). */
router.get('/', async (_req, res) => {
  const categoryIds = await Product.distinct('category', {
    showOnStorefront: { $ne: false },
    category: { $exists: true, $ne: null },
  })
  const list = await Category.find({ _id: { $in: categoryIds } })
    .sort({ name: 1 })
    .lean()
  res.json(list)
})

export default router
