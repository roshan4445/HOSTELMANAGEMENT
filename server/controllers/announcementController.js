const Announcement = require('../models/Announcement');

exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ owner: req.user._id }).sort({ createdAt: -1 });
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
