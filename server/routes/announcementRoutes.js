const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');
const { protect, requireRole } = require('../middleware/auth');
const { validateCreateAnnouncement } = require('../middleware/validate');

router.route('/')
  .get(protect, getAnnouncements)
  .post(protect, requireRole('owner'), validateCreateAnnouncement, createAnnouncement);

router.route('/:id')
  .delete(protect, requireRole('owner'), deleteAnnouncement);

module.exports = router;
