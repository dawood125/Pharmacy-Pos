import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  barcode: { type: String, unique: true, sparse: true },
  batchNumber: { type: String },
  category: { type: String },
  purchasePrice: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  expiryDate: { type: Date },
  lowStockThreshold: { type: Number, default: 10 },
  status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' }
}, { timestamps: true });

productSchema.index({ name: 'text', barcode: 'text' });

export default mongoose.model('Product', productSchema);