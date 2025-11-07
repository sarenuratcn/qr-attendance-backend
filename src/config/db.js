const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  console.log("🌐 MONGO_URI =>", uri); // DEBUG: şu an nereye bağlanıyoruz gör
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000, // bağlantı hata verirse hızlı düşsün
    });
    console.log("✅ MongoDB connected (Atlas)");
  } catch (err) {
    console.error("❌ MongoDB connect error:", err);
    process.exit(1); // Atlas'a bağlanamıyorsak sunucu devam etmesin
  }
}

module.exports = connectDB;
