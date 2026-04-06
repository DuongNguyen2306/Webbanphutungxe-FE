import mongoose from 'mongoose'

const variantSchema = new mongoose.Schema(
  {
    typeName: { type: String, default: '' },
    color: { type: String, default: '' },
    size: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    isAvailable: { type: Boolean, default: true },
    images: [{ type: String }],
  },
  { _id: true },
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, index: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: { type: String, default: '' },
    images: [{ type: String }],
    brand: { type: String, default: 'honda' },
    vehicleType: { type: String, default: 'scooter' },
    partCategory: { type: String, default: 'accessories' },
    homeFeature: { type: String, default: null },
    showOnStorefront: { type: Boolean, default: true },
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    variants: [variantSchema],
  },
  { timestamps: true },
)

export const Product = mongoose.model('Product', productSchema)
