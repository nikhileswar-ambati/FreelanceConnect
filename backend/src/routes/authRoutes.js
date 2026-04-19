const router = require("express").Router();
const ctrl = require("../controllers/authController");
 
// Public routes — no authentication required
router.post("/signup", ctrl.signup);
router.post("/login", ctrl.login);
 
module.exports = router;