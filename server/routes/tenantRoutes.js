const express = require('express');
const router = express.Router();
const { getTenants, createTenant, moveOutTenant, giveNotice } = require('../controllers/tenantController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getTenants)
  .post(protect, createTenant);

router.route('/:id/moveout').put(protect, moveOutTenant);
router.route('/:id/notice').post(protect, giveNotice);

module.exports = router;
