const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Room = require('./models/Room');

dotenv.config();

const check = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg-crm');
  const rooms = await Room.find().populate('occupants');
  for (const r of rooms) {
    if (r.occupants.length > r.capacity) {
      console.log(`Room ${r.roomNumber} has ${r.occupants.length} occupants but capacity is ${r.capacity}`);
    }
  }
  process.exit();
};

check();
