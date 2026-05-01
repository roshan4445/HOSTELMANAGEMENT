const { google } = require('googleapis');
require('dotenv').config();

const testSync = async () => {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    console.log("Authorizing...");
    const token = await auth.authorize();
    console.log("Token received.");

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Adjust range depending on Google form output. Usually 'Form Responses 1!A2:H'
    console.log("Fetching from sheet...");
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Form Responses 1!A2:H',
    });

    const rows = response.data.values;
    console.log("Rows fetched:", rows ? rows.length : 0);
    if (rows) console.log(rows);
  } catch (error) {
    console.error('Error syncing Google Sheets:', error.message);
  }
};

testSync();
