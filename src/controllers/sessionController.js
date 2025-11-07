const os = require("os");
const Session = require('../models/Session');
const { genDataUrl } = require('../utils/qrcodeGenerator');
const crypto = require('crypto');
const mongoose = require('mongoose');

function genSessionId() {
  return crypto.randomBytes(6).toString('hex');
}

// LAN IPv4'i otomatik bul (Wi-Fi/Ethernet)
// 192.168.x.x / 10.x.y.z / 172.16–31.x.x araligi icinden, internal=false olani al
function getLanIPv4() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const info of ifaces[name] || []) {
      if (
        info.family === 'IPv4' &&
        !info.internal &&
        (
          info.address.startsWith('192.168.') ||
          info.address.startsWith('10.') ||
          info.address.startsWith('172.16.') || info.address.startsWith('172.17.') ||
          info.address.startsWith('172.18.') || info.address.startsWith('172.19.') ||
          info.address.startsWith('172.2')    || // 172.20–29
          info.address.startsWith('172.3')       // 172.30–31
        )
      ) {
        return info.address;
      }
    }
  }
  return null;
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

    // 1) .env’de ATTEND_BASE_URL varsa onu kullan
    // 2) Yoksa, telefonun gorebilecegi LAN IP’yi otomatik bul
    // 3) HICBIRI yoksa, son care host header (localhost ise telefonda calismaz)
    const envBase = process.env.ATTEND_BASE_URL; // ornek: http://192.168.1.55:4000
    const lan = getLanIPv4();
    const headerHost = req.headers.host; // ornek: localhost:4000
    const proto = (req.headers['x-forwarded-proto'] || 'http');

    let base;
    if (envBase) {
      base = envBase.replace(/\/+$/, '');
    } else if (lan) {
      const port = (headerHost && headerHost.includes(':')) ? headerHost.split(':')[1] : '4000';
      base = `${proto}://${lan}:${port}`;
    } else {
      base = `${proto}://${headerHost}`; // localhost kalir (sadece PC’de calisir)
    }

    const qrUrl = `${base}/attend?session=${sessionId}`;
    const qrDataUrl = await genDataUrl(qrUrl);

    return res.json({
      success: true,
      sessionId,
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      qrDataUrl,
      attendUrl: qrUrl,
      baseUsed: base
    });
  } catch (err) {
    console.error('❌ createSession hata:', err);
    return res.status(500).json({ success: false, message: 'Oturum oluşturulamadı' });
  }
};