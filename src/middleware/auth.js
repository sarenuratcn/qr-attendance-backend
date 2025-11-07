const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  // Header yoksa veya "Bearer ..." şeklinde değilse
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Token yok. Yetkisiz erişim."
    });
  }

  // "Bearer "den sonrasını al
  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "devsecret"
    );
    req.user = decoded; // öğretmen bilgisi
    next(); // devam et
  } catch (err) {
    console.error("auth middleware error:", err);
    return res.status(401).json({
      success: false,
      message: "Token geçersiz."
    });
  }
};
