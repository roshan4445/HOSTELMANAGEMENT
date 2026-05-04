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
  noticeDate: { type: Date },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  paymentMethod: { type: String, enum: ['UPI', 'Cash'], default: 'UPI' },
  rentAmount: { type: Number, required: true },
  deposit: { type: Number, default: 0 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Dynamic derived fields (Single Source of Truth)
tenantSchema.virtual('status').get(function() {
  if (!this.moveOutDate || this.moveOutDate > new Date()) {
    return 'Active';
  }
  return 'MovedOut';
});

tenantSchema.virtual('noticeGiven').get(function() {
  return this.moveOutDate && this.moveOutDate > new Date();
});

// Performance and constraint indexes
// Prevent duplicate tenants per owner
tenantSchema.index({ owner: 1, phone: 1 }, { unique: true });
tenantSchema.index({ userAccount: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);
