const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./models/User');
  const Tenant = require('./models/Tenant');
  
  const tenants = await Tenant.find({ userAccount: { $exists: false } }).populate('owner');
  let count = 0;
  
  for (let tenant of tenants) {
    if (!tenant.email) continue;
    
    let user = await User.findOne({ email: tenant.email });
    
    if (!user) {
      // Create user with a random temporary password
      const plainPassword = require('crypto').randomBytes(6).toString('hex');
      
      const ownerUser = await User.findById(tenant.owner);
      
      user = await User.create({
        name: tenant.name,
        email: tenant.email,
        password: plainPassword,
        pgName: ownerUser ? ownerUser.pgName : 'Unknown PG',
        role: 'tenant',
        isApproved: true
      });
      console.log('Created user for tenant:', tenant.email);
      count++;
    }
    
    tenant.userAccount = user._id;
    await tenant.save();
  }
  
  console.log('Successfully generated', count, 'tenant accounts.');
  process.exit(0);
});
