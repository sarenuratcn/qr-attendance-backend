// src/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

// ROUTES
const authRoute = require("./routes/auth");
const attendRouter = require("./routes/attend");
const sessionsRoute = require("./routes/sessions");
const seedRoute = require("./routes/seed");
const legalRoute = require("./routes/legal");

const app = express();
app.set("trust proxy", 1);

/* ---------------- CORS (Express 5 uyumlu) ---------------- */
const ALLOW_LIST = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
// Örnek (Render > Environment):
// CORS_ORIGINS=https://qr-frontend-xxxxx.vercel.app, http://localhost:5173

function isAllowedOrigin(origin, reqHost) {
  // originsiz istekler (Postman/cURL/aynı origin form postu) serbest
  if (!origin) return true;

  try {
    const u = new URL(origin);

    // Backend ile aynı origin ise (örn: /attend formu) izin ver
    if (u.host === reqHost) return true;

    // ENV allow-list
    if (ALLOW_LIST.includes(origin)) return true;

    // localhost serbest
    if (/^https?:\/\/localhost(:\d+)?$/i.test(origin)) return true;

    // Yaygîn: Vercel ve Render domainlerine izin ver (gerekirse)
    if (/\.vercel\.app$/i.test(u.host)) return true;
    if (/\.onrender\.com$/i.test(u.host)) return true;
  } catch (_) {
    /* yok say */
  }
  return false;
}

function corsOptionsDelegate(req, cb) {
  const origin = req.headers.origin;
  const reqHost = req.get("host");
  const ok = isAllowedOrigin(origin, reqHost);

  cb(null, {
    origin: ok,                     // true/false
    credentials: true,              // cookie/jwt icin
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"],
  });
}

// tum isteklerde CORS uygula
app.use((req, res, next) => cors(corsOptionsDelegate)(req, res, next));

// Preflight OPTIONS — wildcard KULLANMADAN
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return cors(corsOptionsDelegate)(req, res, () => res.sendStatus(204));
  }
  next();
});
/* ---------------- /CORS ---------------- */

/* --------------- Parsers --------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* --------------- Healthcheck ------------ */
app.get("/ping", (_req, res) => res.send("pong"));

/* --------------- MongoDB --------------- */
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/qr-attendance";
mongoose
  .connect(MONGO_URI)
  .then(() => {
    const conn = mongoose.connection;
    const where = (conn.host || "").includes("mongodb.net") ? "Atlas" : "Local";
    console.log(`✅ MongoDB connected → ${where} [host=${conn.host}] db=${conn.name}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connect error:", err);
  });

/* --------------- Routes ---------------- */
// Hem /attend hem /api/attend altinda calissin
app.use("/attend", attendRouter);
app.use("/api/attend", attendRouter);

app.use("/api/auth", authRoute);
app.use("/api/sessions", sessionsRoute);
app.use("/api", seedRoute);
app.use("/", legalRoute);

/* --------------- 404 ------------------- */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
    path: req.path,
  });
});

/* --------------- Error handler --------- */
app.use((err, req, res, _next) => {
  console.error("❌ Global error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server error",
  });
});

/* --------------- Listen ---------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Server listening on", PORT);
});
