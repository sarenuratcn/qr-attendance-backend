// src/models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    studentNumber: { type: String, required: true },
    deviceId: { type: String, required: true, index: true }, // cookie ile geliyor
    source: { type: String, enum: ['qr', 'manual'], default: 'qr' },
    attendedAt: { type: Date, default: Date.now },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  },
  { timestamps: true }
);

// Aynı derste aynı cihaz ikinci kez yoklamasın
attendanceSchema.index({ sessionId: 1, deviceId: 1 }, { unique: true });

// Aynı derste aynı numara ikinci kez yoklamasın
attendanceSchema.index({ sessionId: 1, studentNumber: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);