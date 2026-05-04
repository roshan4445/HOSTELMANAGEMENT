const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Room = require('../models/Room');
const connectDB = require('../config/db');

dotenv.config();

const migrate = async () => {
  try {
    await connectDB();
    console.log('Connected to DB. Starting migration to remove upcomingVacancy from Room schema...');

    // Use $unset to remove the upcomingVacancy field from all documents in the rooms collection
    const result = await Room.updateMany(
      { upcomingVacancy: { $exists: true } },
      { $unset: { upcomingVacancy: "" } }
    );

    console.log(`Migration successful! Modified ${result.modifiedCount} rooms.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
