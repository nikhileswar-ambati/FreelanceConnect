const router = require("express").Router();
const ctrl = require("../controllers/freelancerController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
 
// Create profile — freelancers only
router.post("/profile", auth, role("freelancer"), ctrl.create);
router.post("/availability", auth, role("freelancer"), ctrl.setAvailability);
 
// Search — must be defined BEFORE /:id routes to avoid route conflicts
router.get("/search", auth, ctrl.search);
router.get("/:id/availability", auth, ctrl.getAvailability);
 
// Schedule — must be BEFORE /profile/:id to prevent "schedule" matching as an :id
router.get("/:id/schedule", auth, ctrl.getSchedule);
 
// Profile CRUD
router.get("/profile/:id", auth, ctrl.get);
router.put("/profile/:id", auth, role("freelancer"), ctrl.update);
router.delete("/profile/:id", auth, role("freelancer"), ctrl.delete);
 
module.exports = router;
