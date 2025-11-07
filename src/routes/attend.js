// src/routes/attend.js
const router = require('express').Router();
const { showForm, submitForm, listBySession } = require('../controllers/attendController');
const { rateLimit } = require('../middleware/rateLimit');
const { manualAdd } = require('../controllers/attendController');

// QR ile açılan form
router.get('/', showForm);        // GET /attend?session=...

// Form gönderimi
router.post('/', submitForm);     // POST /attend?session=...

// Öğretmen paneli listesi
router.get('/list', listBySession); // GET /attend/list?session=...

// POST /attend?session=...
// 10 sn'de en fazla 3 gönderim (ip+userAgent)
router.post('/', rateLimit({ windowMs: 10_000, max: 3 }), submitForm);

router.post('/manual', manualAdd);


module.exports = router;
