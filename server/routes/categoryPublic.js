import express from 'express'
import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'

const router = express.Router()

function slugifyName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Chỉ danh mục đang có ít nhất một sản phẩm hiển thị trên cửa hàng (đồng bộ với GET /api/products). */
router.get('/', async (_req, res) => {
  const categoryIds = await Product.distinct('category', {
    showOnStorefront: { $ne: false },
    category: { $exists: true, $ne: null },
  })
  const list = await Category.find({ _id: { $in: categoryIds } })
    .sort({ name: 1 })
    .lean()
  res.json(
    list.map((c) => ({
      ...c,
      slug: c.slug || slugifyName(c.name),
    })),
  )
})

export default router
