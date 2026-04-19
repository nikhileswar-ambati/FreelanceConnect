const router = require("express").Router();
const ctrl = require("../controllers/optionsController");

router.get("/locations", ctrl.locations);
router.get("/skills", ctrl.skills);
router.get("/availability", ctrl.availability);

module.exports = router;
