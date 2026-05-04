const Room = require('../models/Room');
const User = require('../models/User');

exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user._id }).limit(500).populate('occupants').lean();
    
    // Compute the status and upcoming vacancy manually
    const roomsWithData = rooms.map(room => {
      const occupants = room.occupants || [];
      const occupantsCount = occupants.length;
      let status = 'Vacant';
      if (occupantsCount > 0) {
        status = occupantsCount >= room.capacity ? 'Occupied' : 'Partial';
      }

      let upcomingVacancy = { isLeaving: false, availableFrom: null };
      const vacatingTenants = occupants.filter(t => t.moveOutDate && new Date(t.moveOutDate) > new Date());
      if (vacatingTenants.length > 0) {
        vacatingTenants.sort((a, b) => new Date(a.moveOutDate) - new Date(b.moveOutDate));
        upcomingVacancy = {
          isLeaving: true,
          availableFrom: vacatingTenants[0].moveOutDate
        };
      }

      return { ...room, status, upcomingVacancy };
    });

    res.json(roomsWithData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRoom = async (req, res) => {
  const { roomNumber, type, capacity, rentAmount, floor } = req.body;
  try {
    const room = await Room.create({
      owner: req.user._id,
      roomNumber,
      type,
      capacity,
      rentAmount,
      floor: floor || 1
    });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPublicRooms = async (req, res) => {
  try {
    const { pgName } = req.params;
    // Escape special regex characters to prevent injection
    const escapedPgName = pgName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const owner = await User.findOne({ pgName: new RegExp(`^${escapedPgName}$`, 'i') });
    
    if (!owner) return res.status(404).json({ message: 'PG not found' });

    const rooms = await Room.find({ owner: owner._id }).limit(500)
      .select('roomNumber type capacity floor rentAmount occupants')
      .populate('occupants').lean();

    const publicRooms = rooms.map(room => {
      const occupants = room.occupants || [];
      const isFull = occupants.length >= room.capacity;
      let status = isFull ? 'Occupied' : 'Vacant';
      let availableFrom = null;
      let vacatingBedsCount = 0;

      const vacatingTenants = occupants.filter(o => o.moveOutDate && new Date(o.moveOutDate) > new Date());
      
      if (vacatingTenants.length > 0) {
        status = 'Upcoming Vacancy';
        vacatingTenants.sort((a, b) => new Date(a.moveOutDate) - new Date(b.moveOutDate));
        availableFrom = vacatingTenants[0].moveOutDate;
        vacatingBedsCount = vacatingTenants.length;
      } else if (!isFull && occupants.length > 0) {
        status = 'Partial';
      }

      const availableBeds = room.capacity - room.occupants.length + vacatingBedsCount;

      return {
        _id: room._id,
        roomNumber: room.roomNumber,
        type: room.type,
        floor: room.floor,
        rentAmount: room.rentAmount,
        capacity: room.capacity,
        currentOccupants: room.occupants.length,
        status,
        availableFrom,
        vacatingBedsCount,
        availableBeds
      };
    });

    res.json({ pgName: owner.pgName, rooms: publicRooms });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
