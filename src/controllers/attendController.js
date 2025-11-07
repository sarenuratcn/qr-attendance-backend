const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');

/**
 * GET /attend?session=...
 * Formu gösterir + cookie atar (yoksa) + localStorage tabanlı attdid üretir
 */
exports.showForm = async (req, res) => {
  try {
    const { session } = req.query;
    if (!session) return res.status(400).send("<h2>❌ Geçersiz bağlantı (session yok)</h2>");

    const s = await Session.findOne({ sessionId: session });
    if (!s) return res.status(400).send("<h2>❌ Oturum bulunamadı</h2>");

    const now = new Date();
    if (s.expiresAt && s.expiresAt <= now) {
      return res.status(400).send("<h2>❌ Bu yoklama artık kapandı</h2>");
    }

    // Cookie: httpOnly KALDIRILDI (mobilde bazı durumlarda header'a düşmeyebiliyor)
  // Cihaz cookie’si yoksa üret
if (!req.cookies?.attdev) {
  const { v4: uuidv4 } = require('uuid');
  res.cookie('attdev', uuidv4(), {
    httpOnly: true,
    sameSite: 'lax',  // Safari için güvenli
    path: '/',        // her yere gönderilsin
    maxAge: 1000 * 60 * 60 * 24 * 365 * 2, // 2 yıl
  });
}


    return res.send(`
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Yoklama</title>
          <style>
            :root { --green:#16a34a; --green-200:#bbf7d0; --ink:#166534; }
            body {
              background:#f0fdf4; min-height:100vh; margin:0;
              display:flex; align-items:center; justify-content:center;
              font-family: system-ui,-apple-system,Roboto,'Segoe UI',sans-serif;
              color:var(--ink); padding:16px;
            }
            .card {
              background:#fff; border:1px solid var(--green-200); border-radius:16px;
              box-shadow:0 20px 50px rgba(0,0,0,.07);
              padding:24px 20px; width:100%; max-width:380px; text-align:center;
            }
            h2 { margin:0 0 14px; font-size:1.1rem; font-weight:700; color:#14532d; }
            form { display:flex; flex-direction:column; gap:12px; margin-bottom:10px; }
            input {
              padding:12px; font-size:1rem; border-radius:10px; border:1px solid #86efac; outline:none; background:#fff;
            }
            input:focus { border-color:var(--green); box-shadow:0 0 0 3px rgba(16,185,129,.23); }
            button {
              padding:12px; font-size:1rem; border:0; border-radius:10px;
              background:var(--green); color:#fff; font-weight:700; cursor:pointer;
            }
            button[disabled]{ background:#9ca3af; cursor:not-allowed; }
            .muted { font-size:.8rem; color:#64748b; text-align:left; }
            .disabled { background:#f3f4f6; color:#6b7280; pointer-events:none; }
            .kvkk {
              margin-top:12px; padding:10px; font-size:.8rem; color:#0f172a; text-align:left;
              background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;
            }
            .kvkk b { color:#0f172a; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Yoklama Formu</h2>

            <form id="attendForm" method="POST" action="/attend?session=${session}">
              <input id="name" name="studentName" placeholder="Ad Soyad" required />
              <input id="num"  name="studentNumber" placeholder="Öğrenci Numarası (9 hane)" required
                     inputmode="numeric" pattern="\\d{9}" maxlength="9" minlength="9" />
              <!-- Sabit cihaz kimliği (localStorage) -->
              <input type="hidden" id="attdid" name="attdid" value="" />
              <button id="btn" type="submit">Gönder</button>
              <div id="hint" class="muted"></div>
            </form>

            <div class="kvkk">
              <b>Aydınlatma:</b>  Sistemimiz <strong>KVKK (6698 sayılı Kişisel Verilerin Korunması Kanunu)</strong>’na tamamen uygundur.
      Detaylı bilgi almak veya tam aydınlatma metnini okumak için
      <a href="https://kvkk.gov.tr/" target="_blank" rel="noopener noreferrer">KVKK Resmî Sitesini</a> ziyaret edebilirsiniz.
          </div>
          <footer>© 2025 Yoklama Sistemi — Tüm Hakları Saklıdır.</footer>

          <script>
            (function(){
              // 1) Cihaz için kalıcı bir ID (attdid) üret ve sakla
              const kDid = 'attdid';
              if (!localStorage.getItem(kDid)) {
                const rnd = (crypto && crypto.randomUUID) ? crypto.randomUUID() :
                            String(Date.now()) + Math.random().toString(36).slice(2);
                localStorage.setItem(kDid, rnd);
              }
              document.getElementById('attdid').value = localStorage.getItem(kDid);

              // 2) Aynı oturum için tekrar gönderimi yerelde kilitle
              const sid   = ${JSON.stringify(session)};
              const kAtt  = 'attended_' + sid;
              const kName = 'att_name_' + sid;
              const kNum  = 'att_num_'  + sid;

              const form = document.getElementById('attendForm');
              const name = document.getElementById('name');
              const num  = document.getElementById('num');
              const btn  = document.getElementById('btn');
              const hint = document.getElementById('hint');

              function lockForm() {
                const oldName = localStorage.getItem(kName) || '';
                const oldNum  = localStorage.getItem(kNum)  || '';
                name.value = oldName; name.classList.add('disabled'); name.setAttribute('disabled','disabled');
                num.value  = oldNum;  num.classList.add('disabled');  num.setAttribute('disabled','disabled');
                btn.textContent = 'Zaten yoklama verdin'; btn.setAttribute('disabled','disabled');
                hint.textContent = 'Bu derse zaten yoklama verdin. İkinci kez gönderemezsin.';
              }

              if (localStorage.getItem(kAtt) === '1') {
                lockForm();
              }

              form.addEventListener('submit', function(e){
                if (localStorage.getItem(kAtt) === '1') {
                  e.preventDefault();
                  return;
                }
                try {
                  localStorage.setItem(kName, name.value.trim());
                  localStorage.setItem(kNum,  num.value.trim());
                  localStorage.setItem(kAtt,  '1');
                } catch(e){}
              });
            })();
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("❌ showForm hata:", err);
    return res.status(500).send("<h2>Sunucu hatası</h2>");
  }
};

/**
 * POST /attend?session=...
 * Kayıt (tekil: sessionId+studentNumber ve sessionId+deviceId)
 */
// src/controllers/attendController.js (sadece submitForm'u değiştir)

exports.submitForm = async (req, res) => {
  try {
    const { studentName, studentNumber } = req.body;
    const { session } = req.query;

    if (!session || !studentName || !studentNumber) {
      return res.status(400).send("<h2>Eksik bilgi gönderildi ❌</h2>");
    }

    const sess = await Session.findOne({ sessionId: session });
    if (!sess) return res.status(400).send("<h2>Geçersiz oturum ❌</h2>");
    if (new Date(sess.expiresAt).getTime() < Date.now()) {
      return res.status(400).send("<h2>Yoklama süresi dolmuş ⛔</h2>");
    }

    // *** COOKIE ZORUNLU ***
    const deviceId = req.cookies?.attdev;
    if (!deviceId) {
      return res
        .status(400)
        .send("<h2>Bu derste çerez (cookie) olmadan yoklama alınmaz. Lütfen tarayıcı çerezlerini açınız.</h2>");
    }

    const name = String(studentName).trim();
    const number = String(studentNumber).trim();

    // *** SUNUCU TARAFI ÖN KONTROL ***
    const exists = await Attendance.findOne({
      sessionId: sess.sessionId,
      $or: [{ deviceId }, { studentNumber: number }],
    });
    if (exists) {
      return res
        .status(400)
        .send("<h2>Bu derse zaten yoklama verdin ❗</h2>");
    }

    // teacherId sadece geçerli ObjectId ise ekle
    const doc = {
      sessionId: sess.sessionId,
      studentName: name,
      studentNumber: number,
      deviceId,
      source: 'qr',
      attendedAt: new Date(),
    };
    if (sess.createdBy && mongoose.Types.ObjectId.isValid(String(sess.createdBy))) {
      doc.teacherId = sess.createdBy;
    }

    await Attendance.create(doc);

    return res.send(`
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Yoklama alındı</title>
          <style>
            body {
              background-color: #f0fdf4;
              color: #166534;
              font-family: system-ui,-apple-system,Roboto,'Segoe UI',sans-serif;
              display:flex; align-items:center; justify-content:center;
              min-height:100vh; padding:16px; text-align:center; margin:0;
            }
            .box{
              background:white; border:1px solid #bbf7d0; border-radius:16px;
              box-shadow:0 20px 50px rgba(0,0,0,0.07);
              padding:24px; max-width:360px; width:100%;
              color:#166534; font-size:0.95rem; font-weight:500; line-height:1.5;
            }
          </style>
        </head>
        <body>
          <div class="box">
            <div>✅ Yoklaman kaydedildi</div>
            <div><b>${name}</b> (${number})</div>
            <div>Teşekkürler 👌</div>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    // duplicate’ler index’ten de yakalansın
    if (err && (err.code === 11000 || err.code === 11001)) {
      return res.status(400).send("<h2>Bu derse zaten yoklama verdin ❗</h2>");
    }
    console.error("❌ submitForm genel hata:", err);
    return res.status(500).send("<h2>Sunucu hatası 😥</h2>");
  }
};



/**
 * GET /attend/list?session=...
 * Öğretmen paneli liste
 */
// GET /attend/list?session=...
exports.listBySession = async (req, res) => {
  try {
    const { session } = req.query;
    if (!session) {
      return res.status(400).json({ success: false, message: "session parametresi gerekli" });
    }

    const items = await Attendance
      .find({ sessionId: session })
      .sort({ attendedAt: -1 })
      .select({ studentName: 1, studentNumber: 1, sessionId: 1, attendedAt: 1, source: 1, _id: 0 });


    return res.json({ success: true, count: items.length, items });
  } catch (err) {
    console.error("❌ listBySession hata:", err);
    return res.status(500).json({ success: false, message: "server error" });
  }
};
exports.manualAdd = async (req, res) => {
  try {
    const { sessionId, studentName, studentNumber } = req.body;
    if (!sessionId || !studentName || !studentNumber) {
      return res.status(400).json({ success:false, message:"Eksik bilgi" });
    }

    const sess = await Session.findOne({ sessionId });
    if (!sess) return res.status(400).json({ success:false, message:"Oturum bulunamadı" });
    if (new Date(sess.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success:false, message:"Süre dolmuş" });
    }

    const doc = {
      sessionId,
      studentName: String(studentName).trim(),
      studentNumber: String(studentNumber).trim(),
      deviceId: `manual:${Date.now()}`, // manual için sembolik
      attendedAt: new Date(),
      source: 'manual',                 // <-- Manuel tarafı
    };
    if (sess.createdBy && mongoose.Types.ObjectId.isValid(String(sess.createdBy))) {
      doc.teacherId = sess.createdBy;
    }

    await Attendance.create(doc);
    return res.json({ success:true });

  } catch (err) {
    if (err && (err.code === 11000 || err.code === 11001)) {
      return res.status(409).json({ success:false, message:"Bu derse zaten yoklama verdin ❗" });
    }
    console.error("manualAdd error:", err);
    return res.status(500).json({ success:false, message:"Server error" });
  }
};