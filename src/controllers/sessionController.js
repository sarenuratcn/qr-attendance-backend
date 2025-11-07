const os = require("os");
const Session = require('../models/Session');
const { genDataUrl } = require('../utils/qrcodeGenerator');
const crypto = require('crypto');
const mongoose = require('mongoose');

function genSessionId() {
  return crypto.randomBytes(6).toString('hex');
}

exports.createSession = async (req, res) => {
  try {
    const durationMinutes = Number(req.body?.durationMinutes || 10);
    if (!durationMinutes || durationMinutes <= 0) {
      return res.status(400).json({ success: false, message: 'Süre geçersiz' });
    }

    const sessionId = genSessionId();
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60_000);

    // token’dan ogretmen id (ObjectId ise) ekle
    const teacherIdFromToken = req.user?._id || req.user?.teacherId;
    const payload = { sessionId, startedAt, expiresAt, isActive: true };
    if (teacherIdFromToken && mongoose.Types.ObjectId.isValid(String(teacherIdFromToken))) {
      payload.createdBy = teacherIdFromToken;
    }

    const sessionDoc = await Session.create(payload);
    console.log('Yeni oturum:', sessionDoc.sessionId, 'bitis:', expiresAt.toISOString());

    /**
     * 🔒 KURAL:
     * - PRODUCTION’da ATTEND_BASE_URL ZORUNLU.
     * - Bu URL bir ORIGIN olmalı (ornegin https://qr-frontend.vercel.app veya https://qr-backend.onrender.com)
     * - Biz her zaman bu ORIGIN + "/attend?session=..." seklinde QR olusturacagiz.
     */
    const envBase = (process.env.ATTEND_BASE_URL || '').trim().replace(/\/+$/, '');
    if (process.env.NODE_ENV === 'production' && !envBase) {
      console.error('❌ ATTEND_BASE_URL eksik (production). QR olusturulamadi.');
      return res.status(500).json({ success: false, message: 'Server misconfigured: ATTEND_BASE_URL missing' });
    }

    // DEV ortamında kolaylik: env yoksa local fallback (sadece gelistirme icin)
    let base = envBase;
    if (!base) {
      const headerHost = req.headers.host; // or: localhost:4000
      const proto = (req.headers['x-forwarded-proto'] || 'http');
      base = `${proto}://${headerHost}`;
    }

    const attendUrl = `${base}/attend?session=${sessionId}`;
    const qrDataUrl = await genDataUrl(attendUrl);

    // debugging icin net log
    console.log('QR attend URL ->', attendUrl);

    return res.json({
      success: true,
      sessionId,
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      qrDataUrl,
      attendUrl,
      baseUsed: base
    });
  } catch (err) {
    console.error('❌ createSession hata:', err);
    return res.status(500).json({ success: false, message: 'Oturum oluşturulamadı' });
  }
};
