const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
require('dotenv').config();

const clean = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg-crm');
  
  // Remove complaints with undefined titles
  await Complaint.deleteMany({ sheetRowId: { $exists: false } });
  await Complaint.deleteMany({ sheetRowId: null });
  await Complaint.deleteMany({ title: "No Title" });

  const complaints = await Complaint.find();
  const seen = new Set();
  
  for (const c of complaints) {
    if (!c.sheetRowId) continue;
    if (seen.has(c.sheetRowId)) {
      await Complaint.findByIdAndDelete(c._id);
      console.log("Deleted duplicate:", c.sheetRowId);
    } else {
      seen.add(c.sheetRowId);
    }
  }

  // Create unique index to prevent this permanently
  await Complaint.collection.createIndex({ sheetRowId: 1 }, { unique: true, sparse: true });
  console.log("Clean complete & unique index created!");
  process.exit();
};

clean();
