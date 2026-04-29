const Tenant = require('../models/Tenant');
const Room = require('../models/Room');

exports.getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ owner: req.user._id }).populate('room');
    res.json(tenants);
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

    // Validate Move In Date (max 10 days difference)
    const today = new Date();
    const moveIn = new Date(moveInDate);
    const diffTime = Math.abs(moveIn - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays > 10) {
      return res.status(400).json({ message: 'Move-in date must be within 10 days of the present date.' });
    }

    // Force rentAmount to match the room's rentAmount
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
      aadhaarImage
    });

    room.occupants.push(tenant._id);
    await room.save();

    res.status(201).json(tenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.moveOutTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    if (tenant.status === 'MovedOut') return res.status(400).json({ message: 'Tenant already moved out' });

    tenant.status = 'MovedOut';
    tenant.moveOutDate = new Date();
    await tenant.save();

    if (tenant.room) {
      const room = await Room.findById(tenant.room);
      if (room) {
        room.occupants = room.occupants.filter(occ => occ.toString() !== tenant._id.toString());
        // Clear upcoming vacancy if it was set
        room.upcomingVacancy = { isLeaving: false, availableFrom: null };
        await room.save();
      }
    }

    res.json({ message: 'Tenant moved out successfully', tenant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.giveNotice = async (req, res) => {
  try {
    const { moveOutDate } = req.body;
    if (!moveOutDate) return res.status(400).json({ message: 'Move-out date is required' });

    const tenant = await Tenant.findOne({ _id: req.params.id, owner: req.user._id });
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    if (tenant.status === 'MovedOut') return res.status(400).json({ message: 'Tenant already moved out' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plannedMoveOut = new Date(moveOutDate);
    plannedMoveOut.setHours(0, 0, 0, 0);

    const diffTime = plannedMoveOut - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 15) {
      return res.status(400).json({ message: 'Notice period must be at least 15 days from today.' });
    }

    tenant.noticeGiven = true;
    tenant.noticeDate = new Date();
    tenant.moveOutDate = plannedMoveOut;
    await tenant.save();

    if (tenant.room) {
      const room = await Room.findById(tenant.room);
      if (room) {
        room.upcomingVacancy = {
          isLeaving: true,
          availableFrom: plannedMoveOut
        };
        await room.save();
      }
    }

    res.json({ message: 'Notice submitted successfully', tenant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
