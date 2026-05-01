const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
require('dotenv').config();

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg-crm');
  const complaints = await Complaint.find();
  console.log("Found complaints in DB:", complaints.length);
  complaints.forEach(c => console.log(c.sheetRowId, c.title));
  process.exit();
};

test();
