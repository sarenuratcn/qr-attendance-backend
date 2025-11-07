const router = require('express').Router();
const { showForm, submitForm, listBySession, manualAdd } = require('../controllers/attendController');
const { rateLimit } = require('../middleware/rateLimit');

// GET /attend?session=...
router.get('/', showForm);

// ✅ Yeni endpoint
router.post('/submit', rateLimit({ windowMs: 10_000, max: 3 }), submitForm);

// ✅ Eski endpoint (geri uyumluluk)
router.post('/', rateLimit({ windowMs: 10_000, max: 3 }), submitForm);

// Liste
router.get('/list', listBySession);

// Manuel giriş (ve alias’lar)
router.post('/manual', rateLimit({ windowMs: 10_000, max: 10 }), manualAdd);
router.post('/manual-add', rateLimit({ windowMs: 10_000, max: 10 }), manualAdd);
router.post('/teacher/manual', rateLimit({ windowMs: 10_000, max: 10 }), manualAdd);

// Debug
router.get('/debug', (_req, res) => res.status(200).send('attend router OK'));

module.exports = router;
