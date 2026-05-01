const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional login account
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  aadhaar: { type: String },
  aadhaarImage: { type: String, required: true, select: false },
  moveInDate: { type: Date, required: true },
  moveOutDate: { type: Date },
  noticeGiven: { type: Boolean, default: false },
  noticeDate: { type: Date },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  paymentMethod: { type: String, enum: ['UPI', 'Cash'], default: 'UPI' },
  status: { type: String, enum: ['Active', 'MovedOut'], default: 'Active' },
  rentAmount: { type: Number, required: true },
  deposit: { type: Number, default: 0 }
}, { timestamps: true });

// Performance indexes
tenantSchema.index({ owner: 1, status: 1 });
tenantSchema.index({ userAccount: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);
