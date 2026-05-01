const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Room = require('./models/Room');
const Tenant = require('./models/Tenant');

dotenv.config();

const fixCapacity = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg-crm');
    
    const rooms = await Room.find();
    for (const room of rooms) {
      if (room.occupants.length > room.capacity) {
        // Find which occupants are exceeding the capacity
        const exceedingOccupants = room.occupants.slice(room.capacity);
        
        // Remove them from the room's occupant list
        room.occupants = room.occupants.slice(0, room.capacity);
        await room.save();

        // Mark the exceeding tenants as MovedOut
        for (const tenantId of exceedingOccupants) {
          await Tenant.findByIdAndUpdate(tenantId, { 
            status: 'MovedOut',
            moveOutDate: new Date()
          });
        }
        console.log(`Fixed Room ${room.roomNumber}`);
      }
    }
    console.log('Done!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

fixCapacity();
