const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');
const { syncGoogleSheets } = require('./controllers/complaintController');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/tenants', require('./routes/tenantRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));

const { autoGenerateAllRents, checkOverdueRents } = require('./controllers/paymentController');

// Run sync job every minute
cron.schedule('* * * * *', () => {
  syncGoogleSheets();
});

// Run rent generation on the 1st of every month at midnight
cron.schedule('0 0 1 * *', () => {
  autoGenerateAllRents();
});

// Check for overdue rents every day at 1 AM
cron.schedule('0 1 * * *', () => {
  checkOverdueRents();
});

const PORT  = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
