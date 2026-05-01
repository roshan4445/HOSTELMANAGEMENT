const User = require('../models/User');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.registerUser = async (req, res) => {
  const { name, email, password, pgName, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, pgName, role: 'owner', isApproved: false });
    if (user) {
      await Settings.create({ owner: user._id });
      return res.status(201).json({ message: 'Registration successful! Your account is currently pending admin approval.' });
    } else {
      return res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      if (!user.isApproved) {
        return res.status(403).json({ message: 'Your account is pending admin approval. Please wait for authorization before logging in.' });
      }
      let tenantContext = {};
      if (user.role === 'tenant') {
        const Tenant = require('../models/Tenant');
        const tenantRecord = await Tenant.findOne({ userAccount: user._id });
        if (tenantRecord) {
          tenantContext = { tenantId: tenantRecord._id, ownerId: tenantRecord.owner };
        }
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        pgName: user.pgName,
        ...tenantContext,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
