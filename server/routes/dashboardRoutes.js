const express = require('express');
const router = express.Router();
const { getDashboardStats, getTenantDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/', protect, (req, res, next) => {
  if (req.user.role === 'tenant') {
    return getTenantDashboardStats(req, res, next);
  }
  return getDashboardStats(req, res, next);
});

module.exports = router;
