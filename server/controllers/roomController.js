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
