const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, deleteAnnouncement, editAnnouncement, markAsRead, getUnreadCount } = require('../controllers/announcementController');
const { protect, requireRole } = require('../middleware/auth');
const { validateCreateAnnouncement } = require('../middleware/validate');

router.route('/')
  .get(protect, getAnnouncements)
  .post(protect, requireRole('owner'), validateCreateAnnouncement, createAnnouncement);

router.get('/unread-count', protect, getUnreadCount);

router.route('/:id')
  .put(protect, requireRole('owner'), editAnnouncement)
  .delete(protect, requireRole('owner'), deleteAnnouncement);

router.post('/:id/read', protect, markAsRead);

module.exports = router;
