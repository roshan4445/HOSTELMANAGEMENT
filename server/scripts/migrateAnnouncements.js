const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Announcement = require('../models/Announcement');
const AnnouncementRead = require('../models/AnnouncementRead');

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB for Migration...');

    const announcements = await Announcement.find({ readBy: { $exists: true, $ne: [] } });
    console.log(`Found ${announcements.length} announcements with legacy read data.`);

    let migratedCount = 0;

    for (const ann of announcements) {
      if (ann.readBy && ann.readBy.length > 0) {
        for (const read of ann.readBy) {
          try {
            await AnnouncementRead.create({
              announcementId: ann._id,
              tenantId: read.tenantId,
              readAt: read.readAt || new Date()
            });
            migratedCount++;
          } catch (err) {
            // Ignore E11000 duplicate key error, meaning it was already migrated
            if (err.code !== 11000) {
              console.error(`Error migrating read for announcement ${ann._id}:`, err.message);
            }
          }
        }
      }
    }

    console.log(`Successfully migrated ${migratedCount} read records to new collection!`);
    
    console.log('Cleaning up: Removing readBy array from all Announcement documents...');
    await Announcement.updateMany({}, { $unset: { readBy: "" } });
    
    console.log('Migration Complete! Safe to remove legacy code.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
