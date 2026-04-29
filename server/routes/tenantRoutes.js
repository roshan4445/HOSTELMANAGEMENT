const express = require('express');
const router = express.Router();
const { getTenants, createTenant, moveOutTenant } = require('../controllers/tenantController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getTenants)
  .post(protect, createTenant);

router.route('/:id/moveout').put(protect, moveOutTenant);

module.exports = router;
