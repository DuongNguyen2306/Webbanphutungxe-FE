import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDb } from './db.js'
import { User } from './models/User.js'
import { Category } from './models/Category.js'
import { Product } from './models/Product.js'
import { resolveCategory } from './lib/categories.js'

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('Thiếu MONGODB_URI')
  process.exit(1)
}

await connectDb(uri)

const adminEmail = process.env.ADMIN_EMAIL
const adminPassword = process.env.ADMIN_PASSWORD
if (adminEmail && adminPassword) {
  const passwordHash = await User.hashPassword(adminPassword)
  await User.findOneAndUpdate(
    { email: adminEmail.toLowerCase() },
    {
      email: adminEmail.toLowerCase(),
      passwordHash,
      role: 'admin',
    },
    { upsert: true, new: true },
  )
  console.log('Admin:', adminEmail)
}

const existing = await Product.countDocuments()
if (existing === 0) {
  const catVespa = await resolveCategory('Vespa')
  const catHonda = await resolveCategory('Honda')
  await Product.create({
    name: 'Gương gù CRG — Winner / Sonic',
    category: catHonda,
    images: [
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&h=600&fit=crop',
    ],
    brand: 'honda',
    vehicleType: 'underbone',
    partCategory: 'accessories',
    homeFeature: null,
    rating: 4.7,
    reviewCount: 120,
    soldCount: 500,
    variants: [
      {
        typeName: 'Kiểu U',
        color: 'Đen carbon',
        size: '',
        price: 320000,
        originalPrice: 450000,
        isAvailable: true,
      },
      {
        typeName: 'Kiểu Gài',
        color: 'Titan',
        size: '',
        price: 340000,
        originalPrice: 470000,
        isAvailable: false,
      },
    ],
  })
  await Product.create({
    name: 'Đội đèn bi cầu Vespa Sprint',
    category: catVespa,
    images: [
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=600&h=600&fit=crop',
    ],
    brand: 'vespa',
    vehicleType: 'scooter',
    partCategory: 'lighting',
    homeFeature: null,
    rating: 4.9,
    reviewCount: 80,
    soldCount: 200,
    variants: [
      {
        typeName: 'LED trắng',
        color: '',
        size: '',
        price: 2790000,
        originalPrice: 3200000,
        isAvailable: true,
      },
    ],
  })
  console.log('Đã seed sản phẩm mẫu.')
} else {
  console.log('Đã có sản phẩm, bỏ qua seed SP.')
}

await mongoose.disconnect()
process.exit(0)
