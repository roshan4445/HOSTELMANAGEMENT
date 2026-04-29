const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  message: {
    type: String,
    required: [true, 'Please add a message']
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
