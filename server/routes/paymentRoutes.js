const express = require('express');
const router = express.Router();
const { getPayments, generateRent, markAsPaid } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getPayments);

router.post('/generate', protect, generateRent);
router.put('/:id/pay', protect, markAsPaid);

const { checkOverdueRents } = require('../controllers/paymentController');
router.post('/test-overdue', protect, async (req, res) => {
  await checkOverdueRents();
  res.json({ message: "Overdue check executed" });
});

module.exports = router;
