const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getComplaints, updateComplaintStatus } = require('../controllers/complaintController');

router.route('/')
  .get(protect, getComplaints);

router.route('/:id')
  .put(protect, updateComplaintStatus);

module.exports = router;
