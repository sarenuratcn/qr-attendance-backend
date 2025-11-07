const express = require('express');
const router = express.Router();
const c = require('../controllers/attendController');
router.get('/', c.showForm);
router.post('/', c.submitForm);
router.get('/list', c.listBySession);
module.exports = router;
