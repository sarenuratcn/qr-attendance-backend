// src/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const app = express();

// ---- CORS ----
// ---- CORS ----
const RAW_ORIGINS = process.env.CORS_ORIGINS || "";
const ALLOW_ORIGINS = RAW_ORIGINS.split(",").map(s => s.trim()).filter(Boolean);
const VERCEL_RE = /^https:\/\/.*\.vercel\.app$/i;

// Her yanıtta Origin'e göre cache ayrıştır
app.use((req, res, next) => { res.setHeader("Vary", "Origin"); next(); });

// CORS'u istek bazında (req'i görerek) uygulayalım ki kendi originimizi serbest bırakabilelim
app.use((req, res, next) => {
  // 1) /attend sayfaları (form HTML’i) ve kendi origin’den gelen istekler engellenmesin
  const origin = req.headers.origin;
  const self = `${req.protocol}://${req.get('host')}`;

  // /attend sayfasına normal gezinme ise (çoğunlukla Origin header yoktur) → bırak
  if (req.path.startsWith('/attend')) return next();

  // Kendi domainimizden gelen (self-origin) istekler → bırak
  if (origin && origin === self) return next();

  // 2) Diğer tüm isteklerde whitelist kontrolü
  return cors({
    origin: (originHdr, cb) => {
      // Origin yoksa (curl, Postman, dosyadan açılan sayfa vs.) → bırak
      if (!originHdr) return cb(null, true);

      const ok =
        ALLOW_ORIGINS.includes(originHdr) ||
        /^https?:\/\/localhost(:\d+)?$/i.test(originHdr) ||
        VERCEL_RE.test(originHdr);

      cb(null, ok);
    },
    credentials: true,
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"],
  })(req, res, next);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// health
app.get("/ping", (req, res) => res.send("pong"));

// routes
app.use("/attend", require("./routes/attend"));
app.use("/api/attend", require("./routes/attend"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/sessions", require("./routes/sessions"));
app.use("/api", require("./routes/seed"));

// 404
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Not Found", path: req.path })
);

// Mongo
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/qr-attendance";
mongoose.connect(MONGO_URI)
  .then(() => {
    const conn = mongoose.connection;
    const where = conn.host.includes("mongodb.net") ? "Atlas" : "Local";
    console.log(`✅ MongoDB connected → ${where} [host=${conn.host}] db=${conn.name}`);
    const PORT = process.env.PORT || 4000;                         // Render kendi PORT'unu verir
    app.listen(PORT, "0.0.0.0", () => console.log("🌐 Server listening on", PORT));
  })
  .catch(err => console.error("❌ MongoDB connect error:", err));
