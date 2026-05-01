const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validate');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for auth routes
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes' },
});

router.post('/register', validateRegister, authLimiter, registerUser);
router.post('/login', validateLogin, authLimiter, loginUser);

module.exports = router;
