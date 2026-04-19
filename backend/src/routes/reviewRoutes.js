const router = require("express").Router();
const ctrl = require("../controllers/reviewController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
 
// IMPORTANT: Static string routes MUST be declared before parameterized /:id routes.
// Otherwise Express matches "top" and "freelancer" as values of :id.
 
// Top freelancers by rating
router.get("/top", auth, ctrl.getTop);
 
// Freelancer-specific routes
router.get("/freelancer/:freelancerId/average", auth, ctrl.getAverage);
router.get("/freelancer/:freelancerId", auth, ctrl.getByFreelancer);
 
// CRUD
router.post("/", auth, role("customer"), ctrl.create);
router.get("/:id", auth, ctrl.get);
router.put("/:id", auth, role("customer"), ctrl.update);
router.delete("/:id", auth, role("customer"), ctrl.delete);
 
module.exports = router;