// src/middleware/rateLimit.js
// Basit bellek içi rate limit (ip + userAgent anahtarıyla)
// Örn: windowMs=10000, max=5 => 10 sn'de en fazla 5 istek

const buckets = new Map(); // key -> { hits: number, resetAt: number }

function rateLimit(opts = {}) {
  const windowMs = Number(opts.windowMs ?? 10000);
  const max = Number(opts.max ?? 5);

  return function (req, res, next) {
    try {
      const ua = String(req.headers["user-agent"] || "ua");
      const ip = String(req.ip || req.connection?.remoteAddress || "ip");
      const key = ip + "|" + ua;

      const now = Date.now();
      let bucket = buckets.get(key);

      if (!bucket || now > bucket.resetAt) {
        // yeni pencere
        bucket = { hits: 0, resetAt: now + windowMs };
        buckets.set(key, bucket);
      }

      bucket.hits += 1;

      // Basit header'lar (güzel görünür)
      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - bucket.hits)));
      res.setHeader("X-RateLimit-Reset", String(Math.floor(bucket.resetAt / 1000)));

      if (bucket.hits > max) {
        const retrySec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
        return res
          .status(429)
          .send(`<h2 style="font-family:system-ui">Çok hızlı! Lütfen ${retrySec} sn bekle.</h2>`);
      }

      next();
    } catch (e) {
      // limiter bozulsa bile istekleri kilitlemeyelim
      next();
    }
  };
}

module.exports = { rateLimit };
