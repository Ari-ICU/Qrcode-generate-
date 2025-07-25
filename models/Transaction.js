// models/Transaction.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const TransactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true, default: uuidv4, index: true },
  merchantId: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ['KHR', 'USD'], default: 'KHR' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  qrCodeUrl: { type: String, required: true },
  reference: { type: String, trim: true },
  webhookData: { type: Object },
  paymentDetails: { type: Object },
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

TransactionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Transaction', TransactionSchema);
