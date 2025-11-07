//const router = require('express').Router();
//const { createSession, checkSession } = require('../controllers/sessionController');

// Oturum oluştur (JSON):
//router.post('/', createSession);

// Oturum geçerli mi? (JSON):
//router.get('/check', checkSession);


const router = require("express").Router();
const { createSession } = require("../controllers/sessionController");

router.post("/", createSession);      // /api/sessions

module.exports = router;
