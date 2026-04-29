const express = require('express');
const router = express.Router();
const { getRooms, createRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getRooms)
  .post(protect, createRoom);

module.exports = router;
