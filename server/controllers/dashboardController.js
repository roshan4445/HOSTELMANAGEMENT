const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');

exports.getDashboardStats = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const rooms = await Room.find({ owner: ownerId }).populate('occupants');
    const totalRooms = rooms.length;
    let vacantRooms = 0;
    let partialRooms = 0;
    let fullRooms = 0;

    rooms.forEach(r => {
      if (r.occupants.length === 0) vacantRooms++;
      else if (r.occupants.length >= r.capacity) fullRooms++;
      else partialRooms++;
    });

    const activeTenants = await Tenant.find({ owner: ownerId, status: 'Active' });

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const currentMonthPayments = await Payment.find({ owner: ownerId, month: currentMonth, year: currentYear });
    const currentMonthRevenue = currentMonthPayments.filter(p => p.status === 'Paid').reduce((acc, p) => acc + p.total, 0);
    const pendingRevenueAmount = currentMonthPayments.filter(p => p.status !== 'Paid').reduce((acc, p) => acc + p.total, 0);
    const totalExpectedRevenue = currentMonthRevenue + pendingRevenueAmount;

    const paidTenantsCount = currentMonthPayments.filter(p => p.status === 'Paid').length;
    const pendingTenantsCount = activeTenants.length - paidTenantsCount;
    const unpaidRentsCount = currentMonthPayments.filter(p => p.status !== 'Paid').length;

    const pendingComplaints = await Complaint.find({ owner: ownerId, status: { $ne: 'Resolved' } });
    const pendingComplaintsCount = pendingComplaints.length;

    // Get last 6 months revenue for chart
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthName = d.toLocaleString('default', { month: 'short' });
      
      const payments = await Payment.find({ owner: ownerId, month: m, year: y, status: 'Paid' });
      const rev = payments.reduce((acc, p) => acc + p.total, 0);
      revenueData.push({ month: monthName, revenue: rev });
    }

    // Recent Activity Feed
    const recentPayments = await Payment.find({ owner: ownerId }).sort({ updatedAt: -1 }).limit(5).populate('tenant');
    const recentComplaints = await Complaint.find({ owner: ownerId }).sort({ createdAt: -1 }).limit(5);
    
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

    res.json({
      totalRooms,
      occupiedRooms: fullRooms + partialRooms,
      activeTenants: activeTenants.length,
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
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
