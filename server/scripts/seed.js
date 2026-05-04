const mongoose = require('mongoose');
require('dotenv').config();

const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Announcement = require('../models/Announcement');
const AnnouncementRead = require('../models/AnnouncementRead');
const Settings = require('../models/Settings');
const User = require('../models/User');

const randomEl = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.log('No owner found.');
      process.exit(1);
    }
    const ownerId = owner._id;

    await Room.deleteMany({});
    await Tenant.deleteMany({});
    await Payment.deleteMany({});
    await Complaint.deleteMany({});
    await Announcement.deleteMany({});
    await AnnouncementRead.deleteMany({});
    await Settings.deleteMany({});
    console.log('Cleared old data');

    // Create 15 Rooms
    const rooms = [];
    let roomNum = 101;
    for (let i = 0; i < 15; i++) {
      if (i > 0 && i % 4 === 0) roomNum = (Math.floor(roomNum / 100) + 1) * 100 + 1; // 101, 102... 201, 202...
      else if (i > 0) roomNum++;

      const cap = randomInt(1, 4);
      let type = cap === 1 ? 'Single' : `${cap} Sharing`;
      // Handle the fact that Room type enum is AC or Non-AC!
      type = randomEl(['AC', 'Non-AC']);
      
      const rent = cap === 1 ? 10000 : cap === 2 ? 7000 : cap === 3 ? 5500 : 4500;
      const rentAmount = type === 'AC' ? rent + 2000 : rent;

      const room = await Room.create({
        owner: ownerId,
        roomNumber: String(roomNum),
        capacity: cap,
        type: type,
        rentAmount: rentAmount,
        floor: Math.floor(roomNum / 100),
        occupants: []
      });
      rooms.push(room);
    }

    // Create 28 Tenants
    const tenants = [];
    const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv', 'Rishi', 'Karan', 'Rohan', 'Neha', 'Priya', 'Riya', 'Anjali', 'Sneha', 'Pooja', 'Kavya', 'Meera', 'Tara', 'Sanya', 'Shruti', 'Nisha', 'Rachna'];
    const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Joshi', 'Reddy', 'Rao', 'Das', 'Roy', 'Chowdhury', 'Bose'];

    for (let i = 0; i < 28; i++) {
      // Find a room that is not full
      const availableRooms = rooms.filter(r => r.occupants.length < r.capacity);
      if (availableRooms.length === 0) break; // no more space

      const room = randomEl(availableRooms);
      
      const tenant = await Tenant.create({
        owner: ownerId,
        name: `${randomEl(firstNames)} ${randomEl(lastNames)}`,
        email: `tenant${i}@example.com`,
        phone: `98${randomInt(10000000, 99999999)}`,
        moveInDate: new Date(2023, randomInt(0, 11), randomInt(1, 28)),
        room: room._id,
        rentAmount: room.rentAmount,
        deposit: room.rentAmount * 2,
        paymentMethod: randomEl(['UPI', 'Cash']),
        aadhaarImage: '/uploads/dummy.png'
      });
      tenants.push(tenant);
      room.occupants.push(tenant._id);
      await room.save();
    }
    console.log(`Created 15 rooms and ${tenants.length} tenants`);

    // Generate 6 months of Payments
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const monthString = `${year}-${String(month).padStart(2, '0')}`;
      const dueDate = new Date(year, month - 1, 5);
      
      const isCurrentMonth = i === 0;

      for (const tenant of tenants) {
        let status = 'Paid';
        let fine = 0;
        let paymentDate = new Date(year, month - 1, randomInt(1, 4)); 

        if (isCurrentMonth) {
           const rand = Math.random();
           if (rand < 0.2) { status = 'Unpaid'; paymentDate = null; }
           else if (rand < 0.35) { status = 'Overdue'; fine = 500; paymentDate = null; }
           else { status = 'Paid'; paymentDate = new Date(); }
        } else {
           const rand = Math.random();
           if (rand < 0.1) { fine = 500; paymentDate = new Date(year, month - 1, randomInt(6, 15)); } // late
           else if (rand < 0.15) { status = 'Overdue'; fine = 500; paymentDate = null; } // still unpaid from past
        }

        await Payment.create({
          owner: ownerId,
          tenant: tenant._id,
          room: tenant.room,
          amount: tenant.rentAmount,
          fine: fine,
          total: tenant.rentAmount + fine,
          status: status,
          dueDate,
          month,
          year,
          monthString,
          paymentMode: randomEl(['UPI', 'Cash']),
          paymentDate
        });
      }
    }
    console.log('Created payment records');

    // Create Complaints
    const complaintTitles = ['AC cooling issue', 'Water leak in washroom', 'Fan making noise', 'WiFi very slow', 'Room cleaning skipped', 'Geyser not heating', 'Door lock broken', 'Pest control needed'];
    for(let i=0; i<8; i++) {
       const t = randomEl(tenants);
       const r = rooms.find(room => room._id.toString() === t.room.toString());
       await Complaint.create({
         owner: ownerId,
         tenant: t._id,
         name: t.name,
         roomNumber: r.roomNumber,
         phone: t.phone,
         title: complaintTitles[i],
         description: 'Please fix this issue as soon as possible. It is causing inconvenience.',
         priority: randomEl(['High', 'Medium', 'Low']),
         status: randomEl(['Pending', 'In Progress', 'Resolved']),
         createdAt: new Date(new Date().setDate(new Date().getDate() - randomInt(1, 10)))
       });
    }

    // Create Announcements
    await Announcement.create({ owner: ownerId, title: 'Rent Reminder', message: 'Please ensure all pending rents are cleared by the 5th to avoid a late fee of ₹500.', priority: 'High', date: new Date(new Date().setDate(new Date().getDate() - 1)) });
    await Announcement.create({ owner: ownerId, title: 'Pest Control Scheduled', message: 'Pest control will happen this Saturday across all floors.', priority: 'Medium', date: new Date() });
    await Announcement.create({ owner: ownerId, title: 'Gym Equipment Upgraded', message: 'New treadmills have been installed on the ground floor.', priority: 'Low', date: new Date() });

    console.log('Seed completed successfully with massive data!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
