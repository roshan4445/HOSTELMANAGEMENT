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
      query = { tenantId: tenant._id };
    } else {
      query = { owner: req.user._id };
    }

    // Backend Filtering
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Max 50 per page
    const skip = (page - 1) * limit;

    const [rawComplaints, total] = await Promise.all([
      Complaint.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Complaint.countDocuments(query)
    ]);

    // Format response to ensure backward compatibility for old data vs new snapshot data
    const complaints = rawComplaints.map(complaint => {
      return {
        ...complaint,
        name: complaint.snapshot?.name || complaint.name,
        roomNumber: complaint.snapshot?.roomNumber || complaint.roomNumber,
        phone: complaint.snapshot?.phone || complaint.phone,
        comments: complaint.comments || []
      };
    });

    res.json({
      complaints,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total
    });
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
      tenantId,
      // Store in new snapshot object
      snapshot: {
        name,
        roomNumber,
        phone
      },
      // Keep flat fields for strict legacy fallback (optional, but safest until full migration)
      name,
      roomNumber,
      phone,
      title,
      description,
      category: category || 'Other',
      priority: priority || 'Medium',
      image,
      comments: []
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

exports.addComment = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Comment message is required' });
    }

    let query = { _id: req.params.id };
    
    // Security: Validate ownership
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userAccount: req.user._id });
      if (!tenant) return res.status(404).json({ message: 'Tenant record not found' });
      query.tenantId = tenant._id;
    } else {
      query.owner = req.user._id;
    }

    const complaint = await Complaint.findOne(query);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found or unauthorized' });
    }

    // Append comment
    const newComment = {
      sender: req.user.role === 'owner' ? 'owner' : 'tenant',
      message,
      createdAt: new Date()
    };
    
    if (!complaint.comments) {
      complaint.comments = [];
    }
    complaint.comments.push(newComment);
    
    await complaint.save();

    // Broadcast update
    try {
      getIO().to(`owner-${complaint.owner}`).emit('complaint-updated', complaint);
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
