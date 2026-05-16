import express from 'express'
import { Product } from '../models/Product.js'
import { resolveCategory } from '../lib/categories.js'

function badgeTagsLower(tags) {
  if (!Array.isArray(tags)) return []
  return tags.map((t) => String(t || '').trim().toLowerCase()).filter(Boolean)
}

/** Thứ tự storefront: new → best-seller → featured → còn lại. */
function storefrontCatalogRank(p) {
  let r = 3
  const t = badgeTagsLower(p.badgeTags)
  if (t.includes('new')) r = Math.min(r, 0)
  if (t.includes('best-seller')) r = Math.min(r, 1)
  if (t.includes('featured')) r = Math.min(r, 2)
  return r
}

function sortStorefrontCatalogDocs(list) {
  return [...list].sort((a, b) => {
    const ra = storefrontCatalogRank(a)
    const rb = storefrontCatalogRank(b)
    if (ra !== rb) return ra - rb
    const ta = new Date(a.createdAt || 0).getTime()
    const tb = new Date(b.createdAt || 0).getTime()
    if (tb !== ta) return tb - ta
    return String(a.name || '').localeCompare(String(b.name || ''), 'vi', { sensitivity: 'base' })
  })
}

function computeAbsoluteMaxPrice(products) {
  let max = 0
  for (const p of products) {
    for (const v of p.variants || []) {
      const price = Number(v.price)
      if (Number.isFinite(price) && price > max) max = price
    }
  }
  return Math.floor(max)
}

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const filter = { showOnStorefront: { $ne: false } }
    const catParam = String(req.query.category || '').trim()
    if (catParam) {
      filter.category = await resolveCategory(catParam)
    }
    const list = await Product.find(filter).populate('category', 'name').lean()
    const items = sortStorefrontCatalogDocs(list)
    res.json({
      items,
      absoluteMaxPrice: computeAbsoluteMaxPrice(items),
    })
  } catch (e) {
    console.error(e)
    res.json({ items: [], absoluteMaxPrice: 0 })
  }
})

router.get('/new-arrivals', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10))
    const filter = { showOnStorefront: { $ne: false }, newArrivalEnabled: true }
    const total = await Product.countDocuments(filter)
    const skip = (page - 1) * limit
    const items = await Product.find(filter)
      .populate('category', 'name')
      .sort({ newArrivalOrder: 1, createdAt: -1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean()
    res.json({
      items,
      page,
      limit,
      total,
      totalPages: total > 0 ? Math.ceil(total / limit) : 0,
    })
  } catch (e) {
    console.error(e)
    res.json({ items: [], page: 1, limit: 10, total: 0, totalPages: 0 })
  }
})

router.get('/best-sellers', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10))
  const filter = { showOnStorefront: { $ne: false }, bestSellerEnabled: true }
  const total = await Product.countDocuments(filter)
  const skip = (page - 1) * limit
  const products = await Product.find(filter)
    .populate('category', 'name')
    .sort({ bestSellerOrder: 1, soldCount: -1, createdAt: -1, name: 1 })
    .skip(skip)
    .limit(limit)
    .lean()
  const items = products.map((p) => ({
    soldQuantity: p.soldCount ?? 0,
    product: p,
  }))
  res.json({
    items,
    page,
    limit,
    total,
    totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  })
})

router.get('/:id', async (req, res) => {
  const p = await Product.findById(req.params.id)
    .populate('category', 'name')
    .lean()
  if (!p) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' })
  if (p.showOnStorefront === false) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' })
  }
  res.json(p)
})

export default router
