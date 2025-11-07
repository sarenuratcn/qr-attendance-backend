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
const ALLOW_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean); // örn: http://localhost:5173,http://192.168.1.44:5173

app.use(
  cors({
    origin: (origin, cb) => {
      // Postman / mobil file URL gibi originsiz istekleri kabul et
      if (!origin) return cb(null, true);
      // Env’den verilenlere + localhost’a izin ver
      const ok =
        ALLOW_ORIGINS.includes(origin) ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin);
      cb(null, ok);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
app.use("/", require("./routes/legal"));


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