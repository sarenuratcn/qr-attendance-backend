require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Teacher = require('../models/Teacher');

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  try {
    console.log('⏳ Atlas’a bağlanılıyor...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Atlas bağlantısı kuruldu.');

    // komut satırından kullanıcı adı / şifre / isim al
    const username = process.argv[2] || 'ogretmen1';
    const password = process.argv[3] || 'sifre123';
    const name = process.argv[4] || 'Ayşe Hoca';

    // şifreyi hashle
    const hash = await bcrypt.hash(password, 10);

    // öğretmeni kaydet
    const teacher = new Teacher({
      username,
      passwordHash: hash,
      name,
    });

    await teacher.save();

    console.log('🎉 Öğretmen eklendi:');
    console.log('  username:', username);
    console.log('  password:', password);
    console.log('  name    :', name);

    process.exit(0);
  } catch (err) {
    console.error('❌ Hata öğretmen oluştururken:', err);
    process.exit(1);
  }
}

run();
