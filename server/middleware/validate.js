const { body, param, validationResult } = require('express-validator');

/**
 * Middleware that checks validation results and returns 400 if any errors found.
 * Must be placed AFTER the validation rules in the middleware chain.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────

const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('pgName').trim().notEmpty().withMessage('PG Name is required')
    .isLength({ max: 100 }).withMessage('PG Name must be under 100 characters'),
  handleValidationErrors
];

const validateLogin = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// ─── Room Validators ──────────────────────────────────────────

const validateCreateRoom = [
  body('roomNumber').trim().notEmpty().withMessage('Room number is required')
    .isLength({ max: 20 }).withMessage('Room number must be under 20 characters'),
  body('type').isIn(['AC', 'Non-AC']).withMessage('Type must be AC or Non-AC'),
  body('capacity').isInt({ min: 1, max: 20 }).withMessage('Capacity must be between 1 and 20'),
  body('rentAmount').isFloat({ min: 0 }).withMessage('Rent amount must be a positive number'),
  body('floor').optional().isInt({ min: 1, max: 50 }).withMessage('Floor must be between 1 and 50'),
  handleValidationErrors
];

// ─── Tenant Validators ───────────────────────────────────────

const validateCreateTenant = [
  body('name').trim().notEmpty().withMessage('Tenant name is required')
    .isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]{7,15}$/).withMessage('Phone number format is invalid'),
  body('email').optional({ checkFalsy: true }).trim().isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('moveInDate').notEmpty().withMessage('Move-in date is required')
    .isISO8601().withMessage('Move-in date must be a valid date'),
  body('roomId').notEmpty().withMessage('Room assignment is required')
    .isMongoId().withMessage('Invalid room ID'),
  body('paymentMethod').optional().isIn(['UPI', 'Cash']).withMessage('Payment method must be UPI or Cash'),
  body('rentAmount').optional().isFloat({ min: 0 }).withMessage('Rent amount must be positive'),
  body('deposit').optional().isFloat({ min: 0 }).withMessage('Deposit must be a positive number'),
  body('aadhaarImage').custom((value, { req }) => {
    if (!req.file) throw new Error('Aadhaar Card Image is required');
    return true;
  }),
  handleValidationErrors
];

const validateGiveNotice = [
  body('moveOutDate').notEmpty().withMessage('Move-out date is required')
    .isISO8601().withMessage('Move-out date must be a valid date'),
  handleValidationErrors
];

// ─── Payment Validators ──────────────────────────────────────

const validateMarkPaid = [
  param('id').isMongoId().withMessage('Invalid payment ID'),
  body('paymentMode').optional().isIn(['UPI', 'Cash', 'Bank Transfer'])
    .withMessage('Payment mode must be UPI, Cash, or Bank Transfer'),
  handleValidationErrors
];

// ─── Complaint Validators ────────────────────────────────────

const validateCreateComplaint = [
  body('title').trim().notEmpty().withMessage('Complaint title is required')
    .isLength({ max: 200 }).withMessage('Title must be under 200 characters'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description must be under 2000 characters'),
  body('category').optional().isIn(['Electrical', 'Plumbing', 'Cleaning', 'Other'])
    .withMessage('Invalid category'),
  body('priority').optional().isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  handleValidationErrors
];

const validateUpdateComplaintStatus = [
  param('id').isMongoId().withMessage('Invalid complaint ID'),
  body('status').isIn(['Pending', 'In Progress', 'Resolved'])
    .withMessage('Status must be Pending, In Progress, or Resolved'),
  handleValidationErrors
];

// ─── Announcement Validators ─────────────────────────────────

const validateCreateAnnouncement = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be under 200 characters'),
  body('message').trim().notEmpty().withMessage('Message is required')
    .isLength({ max: 2000 }).withMessage('Message must be under 2000 characters'),
  body('priority').optional().isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateRoom,
  validateCreateTenant,
  validateGiveNotice,
  validateMarkPaid,
  validateCreateComplaint,
  validateUpdateComplaintStatus,
  validateCreateAnnouncement
};
