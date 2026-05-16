import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    variantLabel: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    contact: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    items: [orderItemSchema],
    shippingAddress: {
      province: { type: String, default: '', trim: true },
      district: { type: String, default: '', trim: true },
      ward: { type: String, default: '', trim: true },
      detail: { type: String, default: '', trim: true },
      note: { type: String, default: '', trim: true },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'contacting', 'confirmed', 'cancelled'],
      default: 'contacting',
    },
    cancelNote: { type: String, default: '' },
  },
  { timestamps: true },
)

export const Order = mongoose.model('Order', orderSchema)
