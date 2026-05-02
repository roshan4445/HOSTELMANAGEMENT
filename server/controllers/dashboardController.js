const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Settings = require('../models/Settings');

exports.getDashboardStats = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const ownerId = req.user._id;
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const startMonth = sixMonthsAgo.getMonth() + 1;
    const startYear = sixMonthsAgo.getFullYear();

    // M4 FIX: Run ALL independent queries in parallel instead of sequentially
    const [
      rooms,
      activeTenantsCount,
      currentMonthAgg,
      pendingComplaintsCount,
      revenueAgg,
      recentPayments,
      recentComplaints,
      unpaidPayments
    ] = await Promise.all([
      Room.find({ owner: ownerId }).lean(),
      Tenant.countDocuments({ owner: ownerId, status: 'Active' }),
      Payment.aggregate([
        { $match: { owner: ownerObjectId, month: currentMonth, year: currentYear } },
        { $group: {
            _id: "$status",
            totalAmount: { $sum: "$total" },
            count: { $sum: 1 }
        }}
      ]),
      Complaint.countDocuments({ owner: ownerId, status: { $ne: 'Resolved' } }),
      Payment.aggregate([
        { 
          $match: { 
            owner: ownerObjectId, 
            status: 'Paid',
            $or: [
              { year: { $gt: startYear } },
              { year: startYear, month: { $gte: startMonth } }
            ]
          } 
        },
        {
          $group: {
            _id: { year: "$year", month: "$month" },
            revenue: { $sum: "$total" }
          }
        }
      ]),
      Payment.find({ owner: ownerId }).sort({ updatedAt: -1 }).limit(5).populate('tenant', 'name').lean(),
      Complaint.find({ owner: ownerId }).sort({ createdAt: -1 }).limit(5).lean(),
      Payment.find({ 
        owner: ownerId, 
        month: currentMonth, 
        year: currentYear, 
        status: { $in: ['Unpaid', 'Overdue'] } 
      }).populate('tenant', 'name contactPhone').populate('room', 'roomNumber').lean()
    ]);

    // Process room stats
    const totalRooms = rooms.length;
    let vacantRooms = 0, partialRooms = 0, fullRooms = 0;
    rooms.forEach(r => {
      const occ = r.occupants ? r.occupants.length : 0;
      if (occ === 0) vacantRooms++;
      else if (occ >= r.capacity) fullRooms++;
      else partialRooms++;
    });

    // Process payment stats
    let currentMonthRevenue = 0, pendingRevenueAmount = 0;
    let paidTenantsCount = 0, unpaidRentsCount = 0;
    currentMonthAgg.forEach(agg => {
      if (agg._id === 'Paid') {
        currentMonthRevenue += agg.totalAmount;
        paidTenantsCount += agg.count;
      } else {
        pendingRevenueAmount += agg.totalAmount;
        unpaidRentsCount += agg.count;
      }
    });

    const totalExpectedRevenue = currentMonthRevenue + pendingRevenueAmount;
    const pendingTenantsCount = activeTenantsCount - paidTenantsCount;

    // Build revenue trend data
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthName = d.toLocaleString('default', { month: 'short' });
      const found = revenueAgg.find(agg => agg._id.year === y && agg._id.month === m);
      revenueData.push({ month: monthName, revenue: found ? found.revenue : 0 });
    }

    // Build recent activity feed
    let recentActivity = [];
    recentPayments.forEach(p => {
      recentActivity.push({
        id: `pay_${p._id}`,
        type: 'Payment',
        title: `Payment ${p.status}`,
        description: `${p.tenant?.name || 'Unknown'} - ₹${p.total}`,
        date: p.updatedAt,
        status: p.status
      });
    });
    recentComplaints.forEach(c => {
      recentActivity.push({
        id: `comp_${c._id}`,
        type: 'Complaint',
        title: `Complaint ${c.status}`,
        description: `${c.title} (${c.name})`,
        date: c.createdAt,
        status: c.status
      });
    });
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    recentActivity = recentActivity.slice(0, 5);

    // Format Unpaid Tenants
    const unpaidTenantsData = unpaidPayments.map(p => {
      let daysLate = 0;
      if (p.dueDate && new Date(p.dueDate) < new Date()) {
        const diffTime = Math.abs(new Date() - new Date(p.dueDate));
        daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      return {
        id: p._id,
        name: p.tenant?.name || 'Unknown',
        room: p.room?.roomNumber || 'N/A',
        amount: p.total,
        daysLate: daysLate,
        phone: p.tenant?.contactPhone || ''
      };
    });

    res.json({
      totalRooms,
      occupiedRooms: fullRooms + partialRooms,
      activeTenants: activeTenantsCount,
      monthlyRevenue: currentMonthRevenue,
      pendingRevenueAmount,
      totalExpectedRevenue,
      unpaidRentsCount,
      pendingComplaintsCount,
      roomStatusData: [
        { name: 'Vacant', value: vacantRooms },
        { name: 'Partial', value: partialRooms },
        { name: 'Full', value: fullRooms }
      ],
      paymentStatusData: [
        { name: 'Paid', value: paidTenantsCount },
        { name: 'Pending', value: pendingTenantsCount > 0 ? pendingTenantsCount : 0 }
      ],
      revenueData,
      recentActivity,
      unpaidTenants: unpaidTenantsData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTenantDashboardStats = async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ userAccount: req.user._id }).populate('room');
    if (!tenant) return res.status(404).json({ message: 'Tenant record not found' });

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Parallelize independent queries
    const [currentPayment, recentPayments, recentComplaints, settings] = await Promise.all([
      Payment.findOne({ tenant: tenant._id, month: currentMonth, year: currentYear }),
      Payment.find({ tenant: tenant._id }).sort({ year: -1, month: -1 }).limit(3).lean(),
      Complaint.find({ tenantId: tenant._id }).sort({ createdAt: -1 }).limit(3).lean(),
      Settings.findOne({ owner: tenant.owner })
    ]);

    // M9 FIX: Use dynamic rentDueDay from settings instead of hardcoded "5th"
    const rentDueDay = settings ? settings.rentDueDay : 5;

    // Notifications / Alerts
    const alerts = [];
    if (currentPayment) {
      if (currentPayment.status === 'Overdue') {
        alerts.push({ type: 'danger', message: `Rent of ₹${currentPayment.total} is overdue!` });
      } else if (currentPayment.status === 'Unpaid') {
        alerts.push({ type: 'warning', message: `Rent of ₹${currentPayment.total} is due on ${rentDueDay}${getOrdinalSuffix(rentDueDay)}.` });
      }
    }

    if (tenant.noticeGiven) {
       alerts.push({ type: 'info', message: `Move-out notice given for ${new Date(tenant.moveOutDate).toLocaleDateString()}` });
    }

    res.json({
      tenant,
      room: tenant.room,
      currentPayment,
      recentPayments,
      recentComplaints,
      alerts
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: returns "st", "nd", "rd", or "th" for a number
function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
