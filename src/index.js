// 🌿 Ortam değişkenlerini yükle
require('dotenv').config();

// 🌿 Modülleri al
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// 🌿 Express uygulamasını başlat
const app = express();

// 🌿 Temel middleware'ler
app.set('trust proxy', 1); // Render HTTPS proxy arkasında çalışıyor
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // HTML form POST için
app.use(cookieParser());

// 🌿 CORS ayarları (sadece izin verilen domainler)
const FRONTEND_URL = process.env.FRONTEND_URL; // vercel adresin
const LOCAL_URL = "http://localhost:5173"; // local test için

app.use(cors({
  origin: [FRONTEND_URL, LOCAL_URL], // birden fazla origin tanımı
  credentials: true, // cookie veya token göndermeye izin ver
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 🔸 Artık app.options('*', cors()) GEREK YOK!
// Path-to-regexp hatasını bu şekilde tamamen önlüyoruz 🚫

// 🌿 Basit test endpoint'i
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Backend aktif 🌿' });
});

// 🌿 ROUTE’ları dahil et
const authRoute = require('./routes/auth');
const attendRoute = require('./routes/attend');
const sessionsRoute = require('./routes/sessions');
const seedRoute = require('./routes/seed');

// 🌿 Ana route kayıtları
app.use('/api/auth', authRoute);
app.use('/api/sessions', sessionsRoute);
app.use('/attend', attendRoute); // QR form buradan açılıyor
app.use('/api', seedRoute);

// 🌿 MongoDB bağlantısı
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB bağlantısı başarılı'))
  .catch(err => console.error('❌ Mongo bağlantı hatası:', err));

// 🌿 404 yakalama (sayfa bulunamadı)
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not Found' });
});

// 🌿 Sunucuyu başlat
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor`);
});
