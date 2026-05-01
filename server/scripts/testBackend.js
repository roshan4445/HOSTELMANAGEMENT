const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg-crm');
  const user = await User.findOne({ role: 'owner' });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
  const headers = { Authorization: `Bearer ${token}` };

  try {
    console.log("Testing /api/dashboard");
    const dRes = await fetch('http://localhost:5000/api/dashboard', { headers });
    const dData = await dRes.json();
    if (!dRes.ok) throw new Error(JSON.stringify(dData));
    console.log("Dashboard OK");
  } catch (err) {
    console.error("Dashboard error:", err.message);
  }

  try {
    console.log("Testing /api/payments");
    const pRes = await fetch('http://localhost:5000/api/payments', { headers });
    const pData = await pRes.json();
    if (!pRes.ok) throw new Error(JSON.stringify(pData));
    console.log("Payments OK");
  } catch (err) {
    console.error("Payments error:", err.message);
  }

  try {
    console.log("Testing /api/payments/generate");
    const gRes = await fetch('http://localhost:5000/api/payments/generate', { method: 'POST', headers });
    const gData = await gRes.json();
    if (!gRes.ok) throw new Error(JSON.stringify(gData));
    console.log("Generate OK:", gData);
  } catch (err) {
    console.error("Generate error:", err.message);
  }

  process.exit();
};

test();
