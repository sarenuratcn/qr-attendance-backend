// src/routes/legal.js
const express = require("express");
const router = express.Router();

router.get("/kvkk", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>KVKK Bilgilendirmesi</title>
<style>
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f8fafc;
  color: #0f172a;
  line-height: 1.6;
  margin: 0;
  padding: 40px 16px;
}
.container {
  max-width: 700px;
  margin: 0 auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.05);
  padding: 32px;
}
h1 {
  color: #1e293b;
  font-size: 1.4rem;
  margin-bottom: 1rem;
}
p { font-size: 0.95rem; }
a { color: #2563eb; text-decoration: none; }
footer {
  margin-top: 40px;
  font-size: 0.85rem;
  color: #64748b;
  text-align: center;
}
</style>
</head>
<body>
  <div class="container">
    <h1>KVKK ve Gizlilik Bilgilendirmesi</h1>
    <p>
      Bu yoklama sistemi yalnızca ders yoklaması amacıyla çalışmaktadır.
      Kişisel verileriniz (ad, soyad, okul numarası) hiçbir şekilde üçüncü kişilerle paylaşılmaz,
      ticari amaçla kullanılmaz ve tamamen yasal çerçevede işlenmektedir.
    </p>
    <p>
      Bu sistem, öğrencilerin kimliğini doğrulamak için yalnızca gerekli minimum bilgileri işler
      ve herhangi bir şekilde konum, cihaz veya özel veri toplamaz.
    </p>
    <p>
      Sistemimiz <strong>KVKK (6698 sayılı Kişisel Verilerin Korunması Kanunu)</strong>’na tamamen uygundur.
      Detaylı bilgi almak veya tam aydınlatma metnini okumak için
      <a href="https://kvkk.gov.tr/" target="_blank" rel="noopener noreferrer">KVKK Resmî Sitesini</a> ziyaret edebilirsiniz.
    </p>
    <footer>© 2025 Yoklama Sistemi — Tüm Hakları Saklıdır.</footer>
  </div>
</body>
</html>
  `);
});

module.exports = router;
