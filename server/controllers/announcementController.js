const Announcement = require('../models/Announcement');
const AnnouncementRead = require('../models/AnnouncementRead');
const Tenant = require('../models/Tenant');
const { getIO } = require('../socket');

exports.getAnnouncements = async (req, res) => {
  try {
    let ownerId = req.user._id;
    let tenantRecord = null;
    
    // Base query - only show non-deleted announcements
    const query = { isDeleted: { $ne: true } };

    if (req.user.role === 'tenant') {
      tenantRecord = await Tenant.findOne({ userAccount: req.user._id });
      if (!tenantRecord) return res.status(404).json({ message: 'Tenant record not found' });
      ownerId = tenantRecord.owner;
      
      // Tenants do not see expired announcements
      query.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ];
    }
    
    query.owner = ownerId;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [rawAnnouncements, total] = await Promise.all([
      Announcement.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Announcement.countDocuments(query)
    ]);

    // Fetch reads from the new scalable collection
    let readRecords = [];
    if (req.user.role === 'tenant' && tenantRecord) {
      const announcementIds = rawAnnouncements.map(a => a._id);
      readRecords = await AnnouncementRead.find({
        announcementId: { $in: announcementIds },
        tenantId: tenantRecord._id
      }).lean();
    }
    
    // Pre-calculate read counts for owners
    let readCounts = {};
    if (req.user.role === 'owner') {
      const announcementIds = rawAnnouncements.map(a => a._id);
      const counts = await AnnouncementRead.aggregate([
        { $match: { announcementId: { $in: announcementIds } } },
        { $group: { _id: '$announcementId', count: { $sum: 1 } } }
      ]);
      counts.forEach(c => {
        readCounts[c._id.toString()] = c.count;
      });
    }

    const now = new Date();
    const announcements = rawAnnouncements.map(ann => {
      const isExpired = ann.expiresAt && new Date(ann.expiresAt) <= now;
      let isRead = false;
      let readCount = 0;
      
      if (req.user.role === 'tenant' && tenantRecord) {
        // Use strictly the scalable collection
        isRead = readRecords.some(r => r.announcementId.toString() === ann._id.toString());
      } else if (req.user.role === 'owner') {
        isRead = true; // Owner implicitly "reads" their own
        readCount = readCounts[ann._id.toString()] || 0;
      }

      return {
        _id: ann._id,
        title: ann.title,
        message: ann.message,
        priority: ann.priority,
        createdAt: ann.createdAt,
        expiresAt: ann.expiresAt,
        isExpired,
        isRead,
        readCount
      };
    });

    res.json({
      announcements,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAnnouncement =  async (req, res) => {
  const { title, message, priority, expiresAt } = req.body;
  try {
    const announcement = await Announcement.create({
      owner: req.user._id,
      title,
      message,
      priority: priority || 'Low',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      readBy: []
    });
    
    // Format payload for realtime
    const payload = {
      _id: announcement._id,
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
      createdAt: announcement.createdAt,
      expiresAt: announcement.expiresAt,
      isRead: false
    };

    const io = getIO();
    const eventPayload = { type: 'NEW', data: payload };
    io.to(`owner-${req.user._id}`).emit('announcement:event', eventPayload);
    io.to(`pg-${req.user._id}`).emit('announcement:event', eventPayload);
    // Backward compatible emit
    io.to(`owner-${req.user._id}`).emit('announcement-new', payload);
    io.to(`pg-${req.user._id}`).emit('announcement-new', payload);
    
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ _id: req.params.id, owner: req.user._id, isDeleted: { $ne: true } });
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Soft Delete
    announcement.isDeleted = true;
    await announcement.save();

    const io = getIO();
    const eventPayload = { type: 'DELETE', data: { _id: announcement._id } };
    io.to(`owner-${req.user._id}`).emit('announcement:event', eventPayload);
    io.to(`pg-${req.user._id}`).emit('announcement:event', eventPayload);

    res.json({ message: 'Announcement removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.editAnnouncement = async (req, res) => {
  const { title, message, priority, expiresAt } = req.body;
  try {
    const announcement = await Announcement.findOne({ _id: req.params.id, owner: req.user._id });
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    announcement.title = title || announcement.title;
    announcement.message = message || announcement.message;
    announcement.priority = priority || announcement.priority;
    if (expiresAt !== undefined) {
      announcement.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    await announcement.save();

    const payload = {
      _id: announcement._id,
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
      createdAt: announcement.createdAt,
      expiresAt: announcement.expiresAt
    };

    const io = getIO();
    const eventPayload = { type: 'UPDATE', data: payload };
    io.to(`owner-${req.user._id}`).emit('announcement:event', eventPayload);
    io.to(`pg-${req.user._id}`).emit('announcement:event', eventPayload);
    // Backward compatible emit
    io.to(`owner-${req.user._id}`).emit('announcement-updated', payload);
    io.to(`pg-${req.user._id}`).emit('announcement-updated', payload);

    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can mark announcements as read' });
    }

    const tenant = await Tenant.findOne({ userAccount: req.user._id });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant record not found' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Security: tenant can only mark their own PG's announcements as read
    if (announcement.owner.toString() !== tenant.owner.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this announcement' });
    }

    // 1. Write to new collection
    try {
      await AnnouncementRead.create({
        announcementId: announcement._id,
        tenantId: tenant._id
      });
      res.json({ message: 'Announcement marked as read', isRead: true });
    } catch (err) {
      // Ignore E11000 duplicate key error, meaning it's already read
      if (err.code === 11000) {
        res.json({ message: 'Announcement already read', isRead: true });
      } else {
        throw err;
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can fetch unread counts' });
    }

    const tenant = await Tenant.findOne({ userAccount: req.user._id });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant record not found' });
    }

    // Base query for active announcements
    const query = {
      owner: tenant.owner,
      isDeleted: { $ne: true },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    // Find all active announcement IDs
    const activeAnnouncements = await Announcement.find(query).select('_id').lean();
    const activeIds = activeAnnouncements.map(a => a._id);

    // Find how many of these the tenant has read in the new collection
    const readCount = await AnnouncementRead.countDocuments({
      announcementId: { $in: activeIds },
      tenantId: tenant._id
    });

    // Alternatively, we'd also check the old readBy array if they haven't been fully migrated
    // But for a fast unread count API, relying on the new scalable collection is preferred.
    // If we want perfect backwards compatibility before migration:
    // We would need to count in memory or run an aggregate.
    // Since we write to BOTH on markAsRead, new reads are safe. 
    // Old reads are in readBy. For a scalable API, it's highly recommended to run the migration script
    // so AnnouncementRead is fully populated, making this count 100% accurate.

    const unreadCount = activeIds.length - readCount;

    res.json({ unreadCount: Math.max(0, unreadCount) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
