const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  createdBy: { type: String, default: 'teacher1' },
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  meta: { type: Object },
});

module.exports = mongoose.model('Session', SessionSchema);
