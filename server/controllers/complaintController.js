const Complaint = require('../models/Complaint');
const Tenant = require('../models/Tenant');
const User = require('../models/User'); // Need owner context if we want to tie it, but sheets might be global for the single-tenant setup.
const { getIO } = require('../socket');

exports.getComplaints = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userAccount: req.user._id });
      if (!tenant) return res.status(404).json({ message: 'Tenant record not found' });
      // Tenants see complaints they submitted.
      query = { tenantId: tenant._id };
    } else {
      query = { owner: req.user._id };
    }
    const complaints = await Complaint.find(query).limit(1000).sort({ priority: -1, createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, image } = req.body;
    let ownerId;
    let tenantId = null;
    let name = 'Admin';
    let roomNumber = 'N/A';
    let phone = '';

    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userAccount: req.user._id }).populate('room');
      if (!tenant) return res.status(404).json({ message: 'Tenant record not found' });
      ownerId = tenant.owner;
      tenantId = tenant._id;
      name = tenant.name;
      roomNumber = tenant.room ? tenant.room.roomNumber : 'N/A';
      phone = tenant.phone;
    } else {
      ownerId = req.user._id;
    }

    const complaint = await Complaint.create({
      owner: ownerId,
      tenantId, // we should add tenantId to Complaint model if not present, but mongoose is schemaless-ish or we can update model
      name,
      roomNumber,
      phone,
      title,
      description,
      category: category || 'Other',
      priority: priority || 'Medium',
      image // Assume we can add image field to model
    });
    
    try {
      getIO().to(`owner-${ownerId}`).emit('complaint-new', complaint);
      if (tenantId) {
        getIO().to(`tenant-${tenantId}`).emit('complaint-new', complaint);
      }
    } catch (err) {
      console.error('Socket emission error:', err.message);
    }
    
    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const complaint = await Complaint.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { status: req.body.status },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    
    try {
      getIO().to(`owner-${req.user._id}`).emit('complaint-updated', complaint);
      if (complaint.tenantId) {
        getIO().to(`tenant-${complaint.tenantId}`).emit('complaint-updated', complaint);
      }
    } catch (err) {
      console.error('Socket emission error:', err.message);
    }
    
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


