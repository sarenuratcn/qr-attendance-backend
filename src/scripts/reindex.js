require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected');

    // (İsterseniz) duplike yapan eski kaydı manuel temizleyin:
    // await Attendance.deleteMany({ deviceId: null });

    console.log('🧹 Dropping indexes...');
    await Attendance.collection.dropIndexes().catch(()=>{});
    console.log('🔁 Rebuilding indexes...');
    await Attendance.syncIndexes();
    console.log('✅ Done');
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
})();
