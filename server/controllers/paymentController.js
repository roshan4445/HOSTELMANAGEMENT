const Payment = require('../models/Payment');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { getIO } = require('../socket');

exports.getPayments = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userAccount: req.user._id });
      if (!tenant) return res.status(404).json({ message: 'Tenant record not found' });
      query = { tenant: tenant._id };
    } else {
      query = { owner: req.user._id };
    }

    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('tenant room')
        .sort({ year: -1, month: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query)
    ]);

    res.json({
      data: payments,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateRent = async (req, res) => {
  try {
    const count = await exports.runRentGeneration(req.user._id);
    res.status(200).json({ message: `Successfully generated ${count} new rent entries.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// M3 FIX: Bulk operations instead of N+1 queries
exports.runRentGeneration = async (ownerId = null) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthString = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const tenantQuery = { status: 'Active' };
  if (ownerId) tenantQuery.owner = ownerId;
  
  const activeTenants = await Tenant.find(tenantQuery).lean();
  if (activeTenants.length === 0) return 0;

  // Bulk fetch: get ALL existing payments for this month in one query
  const tenantIds = activeTenants.map(t => t._id);
  const existingPayments = await Payment.find({
    tenant: { $in: tenantIds },
    monthString
  }).select('tenant').lean();

  const existingTenantSet = new Set(existingPayments.map(p => p.tenant.toString()));

  // Filter tenants that don't have a payment yet
  const tenantsNeedingPayment = activeTenants.filter(
    t => !existingTenantSet.has(t._id.toString())
  );

  if (tenantsNeedingPayment.length === 0) return 0;

  // Bulk fetch settings for all relevant owners
  const ownerIds = [...new Set(tenantsNeedingPayment.map(t => t.owner.toString()))];
  const settingsList = await Settings.find({ owner: { $in: ownerIds } }).lean();
  const ownerSettingsMap = {};
  for (const s of settingsList) {
    ownerSettingsMap[s.owner.toString()] = s;
  }

  // Create default settings for owners that don't have one
  for (const oid of ownerIds) {
    if (!ownerSettingsMap[oid]) {
      const created = await Settings.create({ owner: oid });
      ownerSettingsMap[oid] = created.toObject();
    }
  }

  // Bulk insert all new payments at once
  const paymentDocs = tenantsNeedingPayment.map(tenant => {
    const settings = ownerSettingsMap[tenant.owner.toString()];
    const dueDate = new Date(currentYear, currentMonth - 1, settings.rentDueDay);
    return {
      owner: tenant.owner,
      tenant: tenant._id,
      room: tenant.room,
      amount: tenant.rentAmount,
      fine: 0,
      total: tenant.rentAmount,
      status: 'Unpaid',
      dueDate,
      month: currentMonth,
      year: currentYear,
      monthString
    };
  });

  await Payment.insertMany(paymentDocs);
  return paymentDocs.length;
};

exports.checkOverdueRents = async () => {
  const now = new Date();
  try {
    const overduePayments = await Payment.find({ status: 'Unpaid', dueDate: { $lt: now } }).lean();
    if (overduePayments.length === 0) return;

    // Bulk fetch settings for all owners
    const ownerIds = [...new Set(overduePayments.map(p => p.owner.toString()))];
    const settingsList = await Settings.find({ owner: { $in: ownerIds } }).lean();
    const ownerSettingsMap = {};
    for (const s of settingsList) {
      ownerSettingsMap[s.owner.toString()] = s;
    }

    // Bulk update using bulkWrite
    const bulkOps = overduePayments.map(payment => {
      const settings = ownerSettingsMap[payment.owner.toString()];
      const fineAmount = settings ? settings.lateFineAmount : 500;
      return {
        updateOne: {
          filter: { _id: payment._id },
          update: {
            $set: {
              status: 'Overdue',
              fine: fineAmount,
              total: payment.amount + fineAmount
            }
          }
        }
      };
    });

    const result = await Payment.bulkWrite(bulkOps);
    if (result.modifiedCount > 0) {
      console.log(`Marked ${result.modifiedCount} rents as Overdue.`);
    }
  } catch (err) {
    console.error("Error checking overdue rents:", err);
  }
};

exports.autoGenerateAllRents = async () => {
  try {
    const count = await exports.runRentGeneration();
    if (count > 0) {
      console.log(`Cron: Generated ${count} rent entries for the new month.`);
    }
  } catch (err) {
    console.error("Error in auto rent generation:", err);
  }
};

exports.markAsPaid = async (req, res) => {
  const { id } = req.params;
  const { paymentMode } = req.body;
  
  try {
    let payment;
    let tenantRecord;
    if (req.user.role === 'tenant') {
      tenantRecord = await Tenant.findOne({ userAccount: req.user._id });
      if (!tenantRecord) return res.status(404).json({ message: 'Tenant record not found' });
      payment = await Payment.findOne({ _id: id, tenant: tenantRecord._id });
    } else {
      payment = await Payment.findOne({ _id: id, owner: req.user._id });
    }

    if (!payment) return res.status(404).json({ message: 'Rent record not found' });

    payment.status = 'Paid';
    payment.paymentMode = paymentMode || 'UPI';
    payment.paymentDate = new Date();
    
    await payment.save();

    // Populate the payment for the real-time event
    const populatedPayment = await Payment.findById(payment._id).populate('tenant room').lean();

    // Emit real-time event to the owner's dashboard
    try {
      const io = getIO();
      io.to(`owner-${payment.owner}`).emit('payment-updated', populatedPayment);
      // Also notify the tenant if the admin marked it paid
      if (tenantRecord) {
        io.to(`tenant-${tenantRecord._id}`).emit('payment-updated', populatedPayment);
      }
    } catch (socketErr) {
      console.error('Socket emit error (non-fatal):', socketErr.message);
    }
    
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
