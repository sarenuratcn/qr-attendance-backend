// src/controllers/sessionController.js
const Session = require('../models/Session');
const { genDataUrl } = require('../utils/qrcodeGenerator');
const crypto = require('crypto');
const mongoose = require('mongoose');

const ATTEND_BASE_URL = process.env.ATTEND_BASE_URL; // opsiyonel

function genSessionId() {
  return crypto.randomBytes(6).toString('hex');
}

exports.createSession = async (req, res) => {
  try {
    const durationMinutes = Number(req.body?.durationMinutes || 10);
    if (!durationMinutes || durationMinutes <= 0) {
      return res.status(400).json({ success:false, message:'Süre geçersiz' });
    }

    const sessionId = genSessionId();
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60_000);

    // (İsteğe bağlı) teacherId
    const teacherIdFromToken = req.user?._id || req.user?.teacherId;
    const payload = { sessionId, startedAt, expiresAt, isActive: true };
    if (teacherIdFromToken && mongoose.Types.ObjectId.isValid(String(teacherIdFromToken))) {
      payload.createdBy = teacherIdFromToken;
    }

    const sessionDoc = await Session.create(payload);
    console.log('Yeni oturum oluşturuldu:', sessionDoc);

    // 🔴 Base URL’i güvenli hesapla:
    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http');
    const host  = req.get('host'); // örn: qr-attendance-backend.onrender.com
    const autoBase = `${proto}://${host}`;
    const attendBase = ATTEND_BASE_URL || autoBase;

    const qrUrl = `${attendBase}/attend?session=${sessionId}`;
    const qrDataUrl = await genDataUrl(qrUrl);

    return res.json({
      success: true,
      sessionId,
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      qrDataUrl,
      attendUrl: qrUrl,  // öğretmen ekranında debug için göster
    });
  } catch (err) {
    console.error('❌ createSession hata:', err);
    return res.status(500).json({ success:false, message:'Oturum oluşturulamadı' });
  }
};
