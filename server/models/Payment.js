const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  amount: { type: Number, required: true },
  fine: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Unpaid', 'Overdue'], default: 'Unpaid' },
  paymentMode: { type: String, enum: ['UPI', 'Cash', 'Bank Transfer'], default: 'Cash' },
  paymentDate: { type: Date },
  dueDate: { type: Date, required: true },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  monthString: { type: String, required: true } // format: YYYY-MM
}, { timestamps: true });

// Performance indexes for frequent query patterns
paymentSchema.index({ owner: 1, monthString: 1 });
paymentSchema.index({ owner: 1, year: -1, month: -1 });
paymentSchema.index({ tenant: 1, monthString: 1 });
paymentSchema.index({ status: 1, dueDate: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
