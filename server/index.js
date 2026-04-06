import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDb } from './db.js'
import { authRequired, adminRequired } from './middleware/auth.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import productPublic from './routes/productPublic.js'
import categoryPublic from './routes/categoryPublic.js'
import orderRoutes from './routes/orderRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api', userRoutes)
app.use('/api/products', productPublic)
app.use('/api/categories', categoryPublic)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', authRequired, adminRequired, adminRoutes)

const PORT = Number(process.env.PORT) || 5000
const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('Thiếu biến môi trường MONGODB_URI')
  process.exit(1)
}
if (!process.env.JWT_SECRET) {
  console.error('Thiếu JWT_SECRET')
  process.exit(1)
}

await connectDb(uri)
app.listen(PORT, () => {
  console.log(`Thai Vũ API http://localhost:${PORT}`)
})
