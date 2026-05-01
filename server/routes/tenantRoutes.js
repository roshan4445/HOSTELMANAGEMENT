const express = require('express');
const router = express.Router();
const { getTenants, createTenant, moveOutTenant, giveNotice } = require('../controllers/tenantController');
const { protect, requireRole } = require('../middleware/auth');
const { validateCreateTenant, validateGiveNotice } = require('../middleware/validate');
const multer = require('multer');

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.route('/')
  .get(protect, requireRole('owner'), getTenants)
  .post(protect, requireRole('owner'), upload.single('aadhaarImage'), validateCreateTenant, createTenant);

router.route('/:id/moveout').put(protect, requireRole('owner'), moveOutTenant);
router.route('/:id/notice').post(protect, validateGiveNotice, giveNotice);

module.exports = router;
