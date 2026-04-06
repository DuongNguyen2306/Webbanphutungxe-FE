import express from 'express'
import { authRequired } from '../middleware/auth.js'
import { User } from '../models/User.js'

const router = express.Router()

router.get('/me', authRequired, async (req, res) => {
  const u = await User.findById(req.userId).select('-passwordHash')
  if (!u) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' })
  res.json(u)
})

export default router
