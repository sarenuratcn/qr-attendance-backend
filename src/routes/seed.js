const router = require("express").Router();
const { seedTeacher } = require("../controllers/seedController"); // örnek

router.post("/seed-teacher", seedTeacher);

module.exports = router;
