const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { syncGoogleSheets } = require('./controllers/complaintController');

dotenv.config();

const runSync = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg-crm');
  await syncGoogleSheets();
  console.log("Sync finished!");
  process.exit();
};

runSync();
