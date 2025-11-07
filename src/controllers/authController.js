const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
const JWT_EXPIRES = '8h';

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("LOGIN username:", username, "password:", password);

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Eksik bilgi",
      });
    }

    // Atlas / Mongo içinden öğretmeni çekiyoruz
    const teacher = await mongoose.connection
      .collection('teachers')
      .findOne({ username: username });

    console.log("TEACHER RAW FROM DB:", teacher);

    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: "Kullanıcı bulunamadı",
      });
    }

    // Şifreyi doğrula:
    // 1) Eğer passwordHash varsa (bizim createTeacher.js böyle kaydediyor)
    let isMatch = false;

    if (teacher.passwordHash) {
      // bcrypt ile kıyasla
      isMatch = await bcrypt.compare(password, teacher.passwordHash);
    } else if (teacher.password) {
      // eski düz şifreli kayıtlar için fallback
      isMatch = teacher.password === password;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Şifre yanlış",
      });
    }

    // Buraya geldiyse şifre doğru → token veriyoruz
    const token = jwt.sign(
      { teacherId: teacher._id, username: teacher.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.json({
      success: true,
      token,
      teacher: {
        username: teacher.username,
        name: teacher.name,
        _id: teacher._id,
      },
    });

  } catch (err) {
    console.error("LOGIN CATCH ERR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
