const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const { getComplaints, updateComplaintStatus, createComplaint, addComment } = require('../controllers/complaintController');
const { validateCreateComplaint, validateUpdateComplaintStatus } = require('../middleware/validate');

router.route('/')
  .get(protect, getComplaints)
  .post(protect, validateCreateComplaint, createComplaint);

router.route('/:id')
  .put(protect, requireRole('owner'), validateUpdateComplaintStatus, updateComplaintStatus);

router.post('/:id/comment', protect, addComment);

module.exports = router;
