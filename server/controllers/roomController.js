const Room = require('../models/Room');

exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ owner: req.user._id }).populate('occupants');
    res.json(rooms);
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
    const User = require('../models/User');
    const owner = await User.findOne({ pgName: new RegExp(`^${pgName}$`, 'i') });
    
    if (!owner) return res.status(404).json({ message: 'PG not found' });

    const rooms = await Room.find({ owner: owner._id })
      .select('roomNumber type capacity floor rentAmount occupants upcomingVacancy')
      .populate('occupants');

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
