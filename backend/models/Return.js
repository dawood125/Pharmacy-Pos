import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  refundAmount: { type: Number, required: true }
});

const returnSchema = new mongoose.Schema({
  originalInvoice: { type: String, required: true },
  returnInvoiceNumber: { type: String, required: true, unique: true },
  items: [returnItemSchema],
  totalRefund: { type: Number, required: true },
  returnMethod: { type: String, enum: ['cash', 'exchange'], default: 'cash' },
  reason: { type: String },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['completed', 'pending'], default: 'completed' }
}, { timestamps: true });

export default mongoose.model('Return', returnSchema);