import mongoose from 'mongoose'
import { Category } from '../models/Category.js'

function slugifyName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function resolveCategory(input) {
  if (input === undefined || input === null || input === '') {
    let cat = await Category.findOne({ nameNormalized: 'khac' })
    if (!cat)
      cat = await Category.create({
        name: 'Khác',
        nameNormalized: 'khac',
        slug: 'khac',
      })
    return cat._id
  }
  const s = String(input).trim()
  if (mongoose.isValidObjectId(s)) {
    const byId = await Category.findById(s)
    if (byId) return byId._id
  }
  const slug = slugifyName(s)
  let doc = await Category.findOne({ slug })
  if (!doc) {
    const norm = s.toLowerCase()
    doc = await Category.findOne({ nameNormalized: norm })
  }
  if (!doc) {
    const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    doc = await Category.findOne({ name: new RegExp(`^${escaped}$`, 'i') })
  }
  if (!doc) {
    const norm = s.toLowerCase()
    doc = await Category.create({
      name: s,
      nameNormalized: norm,
      slug: slug || norm.replace(/\s+/g, '-'),
    })
  }
  return doc._id
}
