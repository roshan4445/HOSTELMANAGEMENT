const mongoose = require('mongoose');

const announcementReadSchema = new mongoose.Schema({
  announcementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Announcement',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  readAt: {
    type: Date,
    default: Date.now
  }
});

// Very important index for querying and preventing duplicates
announcementReadSchema.index({ announcementId: 1, tenantId: 1 }, { unique: true });
announcementReadSchema.index({ tenantId: 1 });

module.exports = mongoose.model('AnnouncementRead', announcementReadSchema);
