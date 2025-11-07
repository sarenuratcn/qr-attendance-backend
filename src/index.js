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


// --- Güvenli CORS (QR tarayınca telefon tarayıcısından cookie gelebilsin) ---
// .env: CORS_ORIGINS virgülle ayrık tekil origin'ler (sonunda / yok)
// Örn: CORS_ORIGINS=https://qr-attendance-frontend.vercel.app
const strip = (u) => (u || '').replace(/\/+$/, '');

const ALLOW_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => strip(s.trim()))
  .filter(Boolean);

// Backend'in dış URL'si (/attend gibi kendi sayfaları için)
const SELF = strip(process.env.RENDER_EXTERNAL_URL || process.env.ATTEND_BASE_URL || "");

// Tüm vercel preview’larını da kabul et (aynı proje için)
const allowVercelPreview = (url) =>
  /^https:\/\/qr-attendance-frontend(-[\w-]+)?\.vercel\.app$/.test(url);

app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);               // Postman / curl / bazı webview'lar
      const o = strip(origin);

      const allowed =
        ALLOW_ORIGINS.includes(o) ||                    // .env'den gelen sabit origin(ler)
        allowVercelPreview(o) ||                        // preview domainleri
        o === SELF ||                                   // backend kendi origin’i (/attend)
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o); // local dev

      return allowed ? cb(null, true) : cb(new Error("CORS policy: origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

// Preflight'ları garanti altına al
app.options("*", cors());



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
