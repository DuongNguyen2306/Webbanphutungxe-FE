import express from 'express'
import { Category } from '../models/Category.js'

const router = express.Router()

router.get('/', async (_req, res) => {
  const list = await Category.find().sort({ name: 1 }).lean()
  res.json(list)
})

export default router
