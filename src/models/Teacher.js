const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', TeacherSchema);
