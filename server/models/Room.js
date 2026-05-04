const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomNumber: { type: String, required: true },
  type: { type: String, enum: ['AC', 'Non-AC'], default: 'Non-AC' },
  capacity: { type: Number, required: true, default: 1 },
  rentAmount: { type: Number, required: true },
  floor: { type: Number, required: true, default: 1 },
  occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }]
}, { timestamps: true });

roomSchema.virtual('status').get(function() {
  const occupants = this.occupants || [];
  if (occupants.length === 0) return 'Vacant';
  if (occupants.length >= this.capacity) return 'Occupied';
  return 'Partial';
});

roomSchema.set('toJSON', { virtuals: true });
roomSchema.set('toObject', { virtuals: true });

// Performance indexes — compound unique prevents duplicate rooms per owner
roomSchema.index({ owner: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
