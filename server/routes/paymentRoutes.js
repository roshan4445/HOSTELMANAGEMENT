const express = require('express');
const router = express.Router();
const { getPayments, generateRent, markAsPaid } = require('../controllers/paymentController');
const { protect, requireRole } = require('../middleware/auth');
const { validateMarkPaid } = require('../middleware/validate');

router.route('/')
  .get(protect, getPayments);

router.post('/generate', protect, requireRole('owner'), generateRent);
router.put('/:id/pay', protect, validateMarkPaid, markAsPaid);

module.exports = router;
