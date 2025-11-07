const { genDataUrl } = require('../utils/qrcodeGenerator');
const crypto = require('crypto');
const Session = require('../models/Session');

function genSessionId() {
  return crypto.randomBytes(6).toString('hex');
}

const ATTEND_BASE_URL = process.env.ATTEND_BASE_URL; 
// örn: https://qr-attendance-backend-vwjj.onrender.com/attend

exports.createSession = async (req, res) => {
  try {
    const durationMinutes = Number(req.body?.durationMinutes || 10);
    const sessionId = genSessionId();
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60000);

    await Session.create({ sessionId, startedAt, expiresAt });

    const url = `${ATTEND_BASE_URL}?session=${sessionId}`;
    const qrDataUrl = await genDataUrl(url);

    res.json({
      success: true,
      sessionId,
      expiresAt,
      qrDataUrl,
      url,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};
