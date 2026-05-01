const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  lateFineAmount: { type: Number, default: 500 },
  rentDueDay: { type: Number, default: 5, min: 1, max: 28 },
  noticePeriodDays: { type: Number, default: 15 }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
