const express = require('express');
const router = express.Router();
const { getRooms, createRoom, getPublicRooms } = require('../controllers/roomController');
const { protect, requireRole } = require('../middleware/auth');
const { validateCreateRoom } = require('../middleware/validate');

router.route('/public/:pgName').get(getPublicRooms);

router.route('/')
  .get(protect, getRooms)
  .post(protect, requireRole('owner'), validateCreateRoom, createRoom);

module.exports = router;
