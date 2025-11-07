const bcrypt = require('bcrypt');
const Teacher = require('../models/Teacher');

exports.seedTeacher = async (req, res) => {
  try {
    // şifreyi hashliyoruz ki login kodun mutlu olsun
    const hashed = await bcrypt.hash("aysehoca123", 10);

    // aynı isimde öğretmen varsa sil
    await Teacher.deleteMany({ username: "ogretmen1" });

    // öğretmeni yeniden oluştur
    const t = await Teacher.create({
      username: "ogretmen1",
      password: hashed,
    });

    return res.json({
      success: true,
      teacher: {
        id: t._id,
        username: t.username
      }
    });
  } catch (err) {
    console.error("seedTeacher hata:", err);
    return res.status(500).json({
      success: false,
      message: "seed hatası"
    });
  }
};