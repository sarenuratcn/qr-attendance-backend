// src/routes/attend.js
const router = require('express').Router();
const { showForm, submitForm, listBySession, manualAdd } = require('../controllers/attendController');
const { rateLimit } = require('../middleware/rateLimit');

// ✅ QR ile açılan yoklama formu (HTML)
// GET /attend?session=...
router.get('/', showForm);

// ✅ Form gönderimi (rate limited)
// POST /attend/submit  ve  /api/attend/submit
router.post('/submit', rateLimit({ windowMs: 10_000, max: 3 }), submitForm);

// ✅ Öğretmen paneli: oturuma göre liste
// GET /attend/list?session=...
router.get('/list', listBySession);

// ✅ Manuel ekleme
// POST /attend/manual
router.post('/manual', manualAdd);

module.exports = router;
