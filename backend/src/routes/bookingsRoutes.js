const router = require("express").Router();
const ctrl = require("../controllers/bookingsController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
 
// Create — customers only
router.post("/request", auth, role("customer"), ctrl.create);
 
// Read — any authenticated user
router.get("/", auth, ctrl.getAll);
// Specific string routes MUST come before /:id to prevent conflicts
router.get("/customer/:customerId", auth, ctrl.getByCustomer);
router.get("/status/:status", auth, ctrl.getByStatus);
router.get("/:id", auth, ctrl.getById);
 
// Status transitions
router.patch("/:id/accept", auth, role("freelancer"), ctrl.accept);
router.patch("/:id/customer-price", auth, role("customer"), ctrl.customerPrice);
router.patch("/:id/freelancer-price", auth, role("freelancer"), ctrl.freelancerPrice);
router.patch("/:id/reject", auth, role("freelancer"), ctrl.reject);
router.patch("/:id/cancel", auth, role("customer"), ctrl.cancel);
router.patch("/:id/complete", auth, role("freelancer"), ctrl.complete);
 
// Delete — customers only (pending bookings)
router.delete("/:id", auth, role("customer"), ctrl.delete);
 
module.exports = router;
