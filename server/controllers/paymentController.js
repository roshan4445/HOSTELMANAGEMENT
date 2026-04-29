const Payment = require('../models/Payment');
const Tenant = require('../models/Tenant');
const User = require('../models/User');

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ owner: req.user._id }).populate('tenant room').sort({ year: -1, month: -1 });
    res.json(payments);
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

exports.runRentGeneration = async (ownerId = null) => {
  let newCount = 0;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthString = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const dueDate = new Date(currentYear, currentMonth - 1, 5);

  const query = { status: 'Active' };
  if (ownerId) query.owner = ownerId;
  
  const activeTenants = await Tenant.find(query);

  for (const tenant of activeTenants) {
    const existing = await Payment.findOne({
      tenant: tenant._id,
      monthString
    });

    if (!existing) {
      await Payment.create({
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
      });
      newCount++;
    }
  }
  return newCount;
};

exports.checkOverdueRents = async () => {
  const now = new Date();
  try {
    const overduePayments = await Payment.updateMany(
      { status: 'Unpaid', dueDate: { $lt: now } },
      { $set: { status: 'Overdue', fine: 500 }, $inc: { total: 500 } }
    );
    if (overduePayments.modifiedCount > 0) {
      console.log(`Marked ${overduePayments.modifiedCount} rents as Overdue.`);
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
    const payment = await Payment.findOne({ _id: id, owner: req.user._id });
    if (!payment) return res.status(404).json({ message: 'Rent record not found' });

    payment.status = 'Paid';
    payment.paymentMode = paymentMode || 'UPI';
    payment.paymentDate = new Date();
    
    await payment.save();
    
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
