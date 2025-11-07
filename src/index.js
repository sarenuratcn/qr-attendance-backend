// src/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const app = express();
app.set("trust proxy", 1);

// ---------- CORS ----------
const RAW = process.env.CORS_ORIGINS || "";
const ALLOW = RAW.split(",").map(s => s.trim()).filter(Boolean); // örn: https://qr-attendance-frontend.vercel.app, http://localhost:5173
const VERCEL_RE = /^https:\/\/.*\.vercel\.app$/i;

app.use((req, res, next) => { res.setHeader("Vary", "Origin"); next(); });
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/Postman/dosya URL
    const ok =
      ALLOW.includes(origin) ||
      /^https?:\/\/localhost(:\d+)?$/i.test(origin) ||
      VERCEL_RE.test(origin);
    return cb(ok ? null : new Error(`CORS blocked: ${origin}`), ok);
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

// ---------- Parsers ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------- Health ----------
app.get("/ping", (req, res) => res.send("pong"));

// ---------- ROUTES (404'tan ÖNCE) ----------
const attendRouter = require("./routes/attend");   // GET/POST /attend
app.use("/attend", attendRouter);                  // <form ... action="/attend?session=...">
app.use("/api/attend", attendRouter);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/sessions", require("./routes/sessions"));
app.use("/api", require("./routes/seed"));

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not Found", path: req.path });
});

// ---------- Mongo + Listen ----------
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/qr-attendance";

mongoose.connect(MONGO_URI)
  .then(() => {
    const conn = mongoose.connection;
    const where = conn.host.includes("mongodb.net") ? "Atlas" : "Local";
    console.log(`✅ MongoDB connected → ${where} [host=${conn.host}] db=${conn.name}`);

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, "0.0.0.0", () => console.log("🌐 Server listening on", PORT));
  })
  .catch(err => console.error("❌ MongoDB connect error:", err));
