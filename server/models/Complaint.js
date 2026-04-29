const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  phone: { type: String },
  roomNumber: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Electrical', 'Plumbing', 'Cleaning', 'Other'], default: 'Other' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  sheetRowId: { type: String } // To prevent duplicates
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
