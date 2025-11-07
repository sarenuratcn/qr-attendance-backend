// src/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

// ROUTES (dosyalar mevcut olmalı)
const attendRouter = require("./routes/attend");
const authRouter = require("./routes/auth");
const sessionsRouter = require("./routes/sessions");
const seedRouter = require("./routes/seed");
const legalRouter = require("./routes/legal");

const app = express();

// --- Güvenli CORS (QR tarayınca telefon tarayıcısından cookie gelebilsin) ---
// CORS AYARI
// CORS — Render + lokal geliştirme için güvenli ayar


// CORS — Render + lokal geliştirme için güvenli ayar
// ===== CORS (Express 5 uyumlu, wildcard KULLANMADAN) =====
const allowList = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean); 
// Örnek ENV: 
// CORS_ORIGINS=https://qr-attendance-backend-xxx.onrender.com, https://qr-frontend-xxx.vercel.app, http://localhost:5173

function isAllowedOrigin(origin, reqHost) {
  if (!origin) return true; // originsiz istekleri (Postman/curl) kabul
  try {
    const url = new URL(origin);

    // Aynı origin (backend sayfasından gelen form) → izin ver
    if (url.host === reqHost) return true;

    // Env allowlist
    if (allowList.includes(origin)) return true;

    // localhost serbest
    if (/^https?:\/\/localhost(:\d+)?$/i.test(origin)) return true;

    // *.onrender.com serbest (opsiyonel)
    if (/\.onrender\.com$/i.test(url.host)) return true;

  } catch { /* parse hatasını yut */ }
  return false;
}

function corsOptionsDelegate(req, callback) {
  const origin = req.headers.origin;
  const reqHost = req.get("host"); // örn: qr-attendance-backend-xxx.onrender.com
  const ok = isAllowedOrigin(origin, reqHost);

  callback(null, {
    origin: ok,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}

// Tüm isteklerde CORS uygula
app.use((req, res, next) => cors(corsOptionsDelegate)(req, res, next));

// Preflight OPTIONS isteklerini *pattern kullanmadan* yakala
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return cors(corsOptionsDelegate)(req, res, () => res.sendStatus(204));
  }
  next();
});
// ===== /CORS =====



// Preflight




// --- Body parsers ---
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // <— HTML form için kritik
app.use(cookieParser());

// Eğer proxy arkasına deploy edersen (Vercel/Render/Nginx), gerçek IP için:
app.set("trust proxy", 1);

// Basit istek log’u (debug sırasında çok faydalı)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// --- Sağlık uçları ---
app.get("/ping", (_req, res) => res.send("pong"));
app.get("/api/ping", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// --- Mongo bağlan ---
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/qr-attendance";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    // Mongo bağlandıktan sonra (then içinde)
const Attendance = require('./models/Attendance');
Attendance.syncIndexes()
  .then(() => console.log('✅ Attendance indexes synced'))
  .catch((e) => console.error('❌ Attendance index sync error:', e));

    const conn = mongoose.connection;
    // Atlas mı local mi bilgisini göster
    const isAtlas =
      (MONGO_URI && MONGO_URI.includes("mongodb.net")) ||
      (conn.host && conn.host.includes("mongodb.net"));
    const where = isAtlas ? "Atlas" : "Local";
    console.log(`✅ MongoDB connected → ${where} [host=${conn.host}] db=${conn.name}`);
  })
  .catch((err) => console.error("❌ MongoDB connect error:", err));

// --- Router kayıtları ---
// attend aynı anda hem /attend hem /api/attend altında çalışsın:
app.use("/attend", attendRouter);
app.use("/api/attend", attendRouter);

app.use("/api/auth", authRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api", seedRouter);
app.use("/", legalRouter); // KVKK / gizlilik sayfaları vs.



// --- 404 ---
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: "Not Found", path: req.path });
});

// --- Genel error handler ---
app.use((err, req, res, _next) => {
  console.error("💥 Error handler:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    // dev aşamasında yardımcı olsun:
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

// --- Server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server listening on ${PORT}`);
});
