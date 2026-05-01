const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Secure Webhook middleware
const protectWebhook = (req, res, next) => {
  const secret = req.headers['x-webhook-secret'];
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: 'Unauthorized webhook request' });
  }
  next();
};

router.post('/generate-rent', protectWebhook, async (req, res) => {
  try {
    await paymentController.autoGenerateAllRents();
    res.json({ message: 'Rent generation webhook executed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/check-overdue', protectWebhook, async (req, res) => {
  try {
    await paymentController.checkOverdueRents();
    res.json({ message: 'Overdue check webhook executed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
