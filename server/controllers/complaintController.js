const Complaint = require('../models/Complaint');
const { google } = require('googleapis');
const User = require('../models/User'); // Need owner context if we want to tie it, but sheets might be global for the single-tenant setup.

// Assuming a single property manager for now, or you'd need the owner ID from the sheet.
// For SaaS, we just associate it with the admin/owner.
// In a real multi-tenant SaaS, you'd map different sheets to different owners.
// Here we'll just fetch the first owner.

exports.getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ owner: req.user._id }).sort({ priority: -1, createdAt: -1 });
    res.json(complaints);
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
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.syncGoogleSheets = async () => {
  console.log('Running Google Sheets Sync Cron Job...');
  try {
    // If no credentials, skip gracefully
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.SPREADSHEET_ID) {
      console.log('Google Sheets credentials missing. Skipping sync.');
      return;
    }

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Adjust range depending on Google form output. Usually 'Form Responses 1!A2:H'
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Form Responses 1!A2:H',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return;
    }

    // Find default owner
    const owner = await User.findOne({ role: 'owner' });
    if (!owner) return;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Expected columns based on the user's actual Google Sheet:
      // 0: Timestamp, 1: Name, 2: Room Number, 3: Email/Phone, 4: Title, 5: Description
      // The user didn't add Category or Priority to their form, so we'll set defaults.
      
      const sheetRowId = `row_${i+2}_${row[0]}`; // Create a unique ID using row number and timestamp
      
      const exists = await Complaint.findOne({ sheetRowId });
      if (!exists) {
        await Complaint.create({
          owner: owner._id,
          name: row[1] || 'Unknown',
          roomNumber: row[2] || 'N/A',
          phone: row[3] || '', // Putting their 4th column (email/phone) here
          title: row[4] || 'No Title',
          description: row[5] || 'No Description',
          category: row[6] || 'Other', // Defaults
          priority: row[7] || 'Medium', // Defaulting to Medium
          sheetRowId
        });
        console.log(`New complaint imported from Google Sheets: ${row[4]}`);
      }
    }
  } catch (error) {
    console.error('Error syncing Google Sheets:', error.message);
  }
};
