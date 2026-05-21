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
    shippingFee: { type: Number, default: 0, min: 0 },
    /** Mã 6 chữ số hiển thị cho khách (đơn mới). */
    orderCode: { type: String, trim: true, sparse: true, unique: true },
    status: {
      type: String,
      enum: [
        'pending',
        'contacting',
        'confirmed',
        'shipping',
        'completed',
        'cancelled',
      ],
      default: 'pending',
    },
    /** Tên nhân viên xử lý đơn (admin). */
    processedBy: { type: String, default: '', trim: true, maxlength: 120 },
    cancelNote: { type: String, default: '' },
    delivery: {
      carrierName: { type: String, default: '', trim: true },
      trackingNumber: { type: String, default: '', trim: true },
    },
    statusHistory: [
      {
        at: { type: Date, required: true },
        fromStatus: { type: String, default: '' },
        toStatus: { type: String, default: '' },
        fromStatusLabel: { type: String, default: '' },
        toStatusLabel: { type: String, default: '' },
        processedBy: { type: String, default: null },
        note: { type: String, default: '' },
        isLegacy: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true },
)

export const Order = mongoose.model('Order', orderSchema)
