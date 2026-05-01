const Announcement = require('../models/Announcement');
const Tenant = require('../models/Tenant');
const { getIO } = require('../socket');

exports.getAnnouncements = async (req, res) => {
  try {
    let ownerId = req.user._id;
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userAccount: req.user._id });
      if (!tenant) return res.status(404).json({ message: 'Tenant record not found' });
      ownerId = tenant.owner;
    }
    const announcements = await Announcement.find({ owner: ownerId }).limit(1000).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAnnouncement =  async (req, res) => {
  const { title, message, priority } = req.body;
  try {
    const announcement = await Announcement.create({
      owner: req.user._id,
      title,
      message,
      priority: priority || 'Low'
    });
    const io = getIO();
    io.to(`owner-${req.user._id}`).emit('announcement-new', announcement);
    io.to(`pg-${req.user._id}`).emit('announcement-new', announcement);
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ _id: req.params.id, owner: req.user._id });
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    await announcement.deleteOne();
    res.json({ message: 'Announcement removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
