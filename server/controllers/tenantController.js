const Tenant = require('../models/Tenant');
const Room = require('../models/Room');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Settings = require('../models/Settings');

exports.getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ owner: req.user._id }).limit(1000).populate('room').lean();
    const tenantsWithVirtuals = tenants.map(t => {
      const isMovedOut = t.moveOutDate && new Date(t.moveOutDate) <= new Date();
      const status = isMovedOut ? 'MovedOut' : 'Active';
      const noticeGiven = t.moveOutDate && new Date(t.moveOutDate) > new Date();
      
      let maskedAadhaar = t.aadhaar;
      if (maskedAadhaar && maskedAadhaar.length >= 4) {
        maskedAadhaar = `XXXX-XXXX-${maskedAadhaar.slice(-4)}`;
      }

      return { ...t, status, noticeGiven, aadhaar: maskedAadhaar };
    });
    res.json(tenantsWithVirtuals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTenant = async (req, res) => {
  const { name, phone, email, moveInDate, roomId, paymentMethod, rentAmount, deposit, aadhaarImage } = req.body;
  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.occupants.length >= room.capacity) return res.status(400).json({ message: 'Room is full' });

    // Aadhaar image validation is handled by the validation middleware
    let imagePath = '';
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    // Validate Move In Date (max 10 days difference)
    const today = new Date();
    const moveIn = new Date(moveInDate);
    const diffTime = Math.abs(moveIn - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays > 10) {
      return res.status(400).json({ message: 'Move-in date must be within 10 days of the present date.' });
    }

    // Removed manual duplicate check because we added a DB-level unique constraint
    // { owner: 1, phone: 1 } which will throw a MongoDB E11000 error.

    const actualRentAmount = room.rentAmount;

    const tenant = await Tenant.create({
      owner: req.user._id,
      name,
      phone,
      email,
      moveInDate,
      room: roomId,
      paymentMethod,
      rentAmount: actualRentAmount,
      deposit: deposit || 0,
      aadhaarImage: imagePath
    });

    room.occupants.push(tenant._id);
    await room.save();

    // Auto-create User account for the tenant
    try {
      if (email) {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
          const owner = await User.findById(req.user._id);
          // Generate a random temporary password — tenant must reset on first login
          const tempPassword = crypto.randomBytes(6).toString('hex');
          
          const newUser = await User.create({
            name,
            email,
            password: tempPassword,
            pgName: owner ? owner.pgName : 'Unknown PG',
            role: 'tenant',
            isApproved: true
          });
          
          tenant.userAccount = newUser._id;
          await tenant.save();
          // TODO: Send temp password to tenant via email/SMS
        }
      }
    } catch (userError) {
      console.error('Error auto-creating tenant user account:', userError.message);
      // We do not fail the tenant creation if user creation fails
    }

    const createdTenant = tenant.toObject({ virtuals: true });
    if (createdTenant.aadhaar && createdTenant.aadhaar.length >= 4) {
      createdTenant.aadhaar = `XXXX-XXXX-${createdTenant.aadhaar.slice(-4)}`;
    }
    res.status(201).json(createdTenant);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A tenant with this phone number already exists in your PG.' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.moveOutTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    const isMovedOut = tenant.moveOutDate && new Date(tenant.moveOutDate) <= new Date();
    if (isMovedOut) return res.status(400).json({ message: 'Tenant already moved out' });

    tenant.moveOutDate = new Date();
    await tenant.save();

    if (tenant.room) {
      const room = await Room.findById(tenant.room);
      if (room) {
        room.occupants = room.occupants.filter(occ => occ.toString() !== tenant._id.toString());
        await room.save();
      }
    }

    const updatedTenant = tenant.toObject({ virtuals: true });
    res.json({ message: 'Tenant moved out successfully', tenant: updatedTenant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.giveNotice = async (req, res) => {
  try {
    const { moveOutDate } = req.body;
    if (!moveOutDate) return res.status(400).json({ message: 'Move-out date is required' });

    let tenant;
    if (req.user.role === 'tenant') {
      const query = req.params.id === 'self' ? { userAccount: req.user._id } : { _id: req.params.id, userAccount: req.user._id };
      tenant = await Tenant.findOne(query);
    } else {
      tenant = await Tenant.findOne({ _id: req.params.id, owner: req.user._id });
    }
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    const isMovedOut = tenant.moveOutDate && new Date(tenant.moveOutDate) <= new Date();
    if (isMovedOut) return res.status(400).json({ message: 'Tenant already moved out' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plannedMoveOut = new Date(moveOutDate);
    plannedMoveOut.setHours(0, 0, 0, 0);

    const diffTime = plannedMoveOut - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let settings = await Settings.findOne({ owner: tenant.owner });
    if (!settings) {
      settings = await Settings.create({ owner: tenant.owner }); // fallback
    }
    const noticePeriodDays = settings.noticePeriodDays;
    
    if (diffDays < noticePeriodDays) {
      return res.status(400).json({ message: `Notice period must be at least ${noticePeriodDays} days from today.` });
    }

    tenant.moveOutDate = plannedMoveOut;
    await tenant.save();

    // Room vacancy is now computed dynamically when fetching rooms, no need to update Room model here.

    const updatedTenant = tenant.toObject({ virtuals: true });
    res.json({ message: 'Notice submitted successfully', tenant: updatedTenant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
