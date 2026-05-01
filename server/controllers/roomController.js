const Room = require('../models/Room');
const User = require('../models/User');

exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user._id }).limit(500).populate('occupants').lean();
    
    // Compute the status manually since .lean() strips Mongoose virtuals
    const roomsWithStatus = rooms.map(room => {
      const occupantsCount = room.occupants ? room.occupants.length : 0;
      let status = 'Vacant';
      if (occupantsCount > 0) {
        status = occupantsCount >= room.capacity ? 'Occupied' : 'Partial';
      }
      return { ...room, status };
    });

    res.json(roomsWithStatus);
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
      .select('roomNumber type capacity floor rentAmount occupants upcomingVacancy')
      .populate('occupants').lean();

    const publicRooms = rooms.map(room => {
      const isFull = room.occupants.length >= room.capacity;
      let status = isFull ? 'Occupied' : 'Vacant';
      let availableFrom = null;

      let vacatingBedsCount = 0;

      if (room.upcomingVacancy && room.upcomingVacancy.isLeaving) {
        status = 'Upcoming Vacancy';
        availableFrom = room.upcomingVacancy.availableFrom;
        vacatingBedsCount = room.occupants.filter(o => o.noticeGiven).length || 1;
      } else if (!isFull && room.occupants.length > 0) {
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
