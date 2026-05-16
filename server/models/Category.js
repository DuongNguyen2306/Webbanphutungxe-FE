import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameNormalized: { type: String, required: true, unique: true, lowercase: true },
    slug: { type: String, trim: true, lowercase: true, sparse: true },
  },
  { timestamps: true },
)

export const Category = mongoose.model('Category', categorySchema)
