// src/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const app = express();

// ---- CORS ----
const RAW_ORIGINS = process.env.CORS_ORIGINS || "";
const ALLOW_ORIGINS = RAW_ORIGINS.split(",").map(s => s.trim()).filter(Boolean);

// vercel preview'ları da ( *.vercel.app ) kabul et
const VERCEL_RE = /^https:\/\/.*\.vercel\.app$/i;

app.use((req, res, next) => { res.setHeader("Vary", "Origin"); next(); });

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                           // curl/Postman/file URLs
    const ok =
      ALLOW_ORIGINS.includes(origin) ||
      /^https?:\/\/localhost(:\d+)?$/i.test(origin) ||
      VERCEL_RE.test(origin);                                     // vercel preview
    if (ok) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

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
