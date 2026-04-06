import express from 'express'
import { Product } from '../models/Product.js'

const router = express.Router()

router.get('/', async (_req, res) => {
  const list = await Product.find({ showOnStorefront: { $ne: false } })
    .populate('category', 'name')
    .lean()
  res.json(list)
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
