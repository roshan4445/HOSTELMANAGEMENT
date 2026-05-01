const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to DB');
  const db = mongoose.connection.db;
  
  const result = await db.collection('users').updateMany(
    { isApproved: { $exists: false } },
    { $set: { isApproved: true, pgName: 'StayFlow Default PG' } }
  );
  
  console.log('Updated existing users:', result.modifiedCount);
  process.exit(0);
}).catch(err => {
  console.error('DB Error:', err);
  process.exit(1);
});
