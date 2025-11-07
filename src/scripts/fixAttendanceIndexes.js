// src/scripts/fixAttendanceIndexes.js
require('dotenv').config();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qr-attendance';

(async () => {
  try {
    console.log('⏳ Bağlanıyor:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Bağlandı.');

    // 1) deviceId null olan eski/hatalı kayıtları temizle
    const delRes = await Attendance.deleteMany({ deviceId: null });
    console.log(`🧹 deviceId:null kayıtlar silindi → ${delRes.deletedCount} adet`);

    // 2) Eski hatalı index'i düşür (varsa)
    try {
      await Attendance.collection.dropIndex('sessionId_1_deviceId_1');
      console.log('🧱 Eski index (sessionId_1_deviceId_1) drop edildi.');
    } catch (e) {
      console.log('ℹ️ Eski index bulunamadı veya zaten drop edilmiş:', e.message);
    }

    // 3) Şema üzerindeki indexleri yeniden senkronize et
    await Attendance.syncIndexes();
    console.log('✅ Indexler senkronize edildi (syncIndexes).');

    process.exit(0);
  } catch (err) {
    console.error('❌ Hata:', err);
    process.exit(1);
  }
})();
