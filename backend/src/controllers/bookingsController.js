const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const bookingModel = require("../models/bookingModel");
const { requireFields, isValidTime, isValidDate } = require("../utils/validators");
 
const VALID_STATUSES = ["pending", "accepted", "completed", "rejected", "cancelled"];
 
// ─────────────────────────────────────────────
// CREATE BOOKING REQUEST
// ─────────────────────────────────────────────
exports.create = asyncHandler(async (req, res) => {
    // roleMiddleware ensures only 'customer' reaches here
    const { requested_time, requested_date, freelancer_id, max_price, requirements } = req.body;
 
    requireFields(req.body, ["requested_time", "requested_date", "freelancer_id"]);
 
    if (!isValidTime(requested_time)) {
        throw new AppError("Invalid time format. Use HH:MM:SS (e.g. 14:30:00).", 400);
    }
    if (!isValidDate(requested_date)) {
        throw new AppError("Invalid date format. Use YYYY-MM-DD (e.g. 2025-06-15).", 400);
    }
 
    // Prevent past-date bookings
    if (new Date(requested_date) < new Date(new Date().toDateString())) {
        throw new AppError("Cannot create a booking for a past date.", 400);
    }
 
    if (max_price !== undefined && (isNaN(max_price) || Number(max_price) < 0)) {
        throw new AppError("max_price must be a non-negative number.", 400);
    }
 
    const customer_id = req.user.customer_id;
    if (!customer_id) {
        throw new AppError("Customer profile not found. Please contact support.", 500);
    }
 
    // Check for conflicting accepted booking at this exact slot
    const conflicts = await bookingModel.checkAvailability(
        freelancer_id,
        requested_date,
        requested_time
    );
    if (conflicts.length > 0) {
        throw new AppError(
            "This freelancer is already booked at the requested date and time. Please choose a different slot.",
            409
        );
    }
 
    let requestId;
    try {
        requestId = await bookingModel.createRequest({
            customer_id,
            freelancer_id: parseInt(freelancer_id, 10),
            requested_date,
            requested_time,
            max_price: max_price !== undefined ? Number(max_price) : 0,
            requirements: requirements ? requirements.trim() : "",
        });
    } catch (err) {
        if (err.message === "SLOT_NOT_AVAILABLE") {
            throw new AppError("Slot not available", 409);
        }
        throw err;
    }
 
    res.status(201).json({
        success: true,
        message: "Booking request submitted successfully.",
        request_id: requestId,
    });
});
 
// ─────────────────────────────────────────────
// GET ALL BOOKINGS
// ─────────────────────────────────────────────
exports.getAll = asyncHandler(async (req, res) => {
    const data = await bookingModel.getAll();
    res.json({ success: true, count: data.length, data });
});
 
// ─────────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────────
exports.getById = asyncHandler(async (req, res) => {
    const data = await bookingModel.getById(req.params.id);
    if (!data) throw new AppError("Booking request not found.", 404);
    res.json({ success: true, data });
});
 
// ─────────────────────────────────────────────
// GET BY CUSTOMER
// ─────────────────────────────────────────────
exports.getByCustomer = asyncHandler(async (req, res) => {
    const data = await bookingModel.getByCustomer(req.params.customerId);
    res.json({ success: true, count: data.length, data });
});
 
// ─────────────────────────────────────────────
// GET BY STATUS
// ─────────────────────────────────────────────
exports.getByStatus = asyncHandler(async (req, res) => {
    const { status } = req.params;
 
    if (!VALID_STATUSES.includes(status)) {
        throw new AppError(
            `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}.`,
            400
        );
    }
 
    const data = await bookingModel.getByStatus(status);
    res.json({ success: true, count: data.length, data });
});
 
// ─────────────────────────────────────────────
// ACCEPT
// ─────────────────────────────────────────────
exports.accept = asyncHandler(async (req, res) => {
    // roleMiddleware ensures only 'freelancer' reaches here
    const { final_price } = req.body;
 
    if (final_price === undefined || final_price === null) {
        throw new AppError("final_price is required to accept a booking.", 400);
    }
    if (isNaN(final_price) || Number(final_price) <= 0) {
        throw new AppError("final_price must be a positive number.", 400);
    }
 
    try {
        await bookingModel.accept(
            parseInt(req.params.id, 10),
            req.user.freelancer_id,
            Number(final_price)
        );
    } catch (err) {
        if (err.message === "NOT_FOUND") throw new AppError("Booking request not found.", 404);
        if (err.message === "INVALID_STATUS")
            throw new AppError("Only pending booking requests can be accepted.", 400);
        if (err.message === "UNAUTHORIZED")
            throw new AppError("You can only accept requests made to you.", 403);
        throw err;
    }
 
    res.json({ success: true, message: "Booking accepted and confirmed successfully." });
});

exports.customerPrice = asyncHandler(async (req, res) => {
    const { max_price } = req.body;

    if (max_price === undefined || max_price === null) {
        throw new AppError("max_price is required.", 400);
    }
    if (isNaN(max_price) || Number(max_price) < 0) {
        throw new AppError("max_price must be a non-negative number.", 400);
    }

    try {
        await bookingModel.updateCustomerPrice(
            parseInt(req.params.id, 10),
            req.user.customer_id,
            Number(max_price)
        );
    } catch (err) {
        if (err.message === "NOT_FOUND") throw new AppError("Booking request not found.", 404);
        if (err.message === "INVALID_STATUS")
            throw new AppError("Only pending booking requests can be updated.", 400);
        if (err.message === "UNAUTHORIZED")
            throw new AppError("You can only update your own requests.", 403);
        throw err;
    }

    res.json({ success: true, message: "Requested price updated successfully." });
});

exports.freelancerPrice = asyncHandler(async (req, res) => {
    const { freelancer_proposed_price } = req.body;

    if (freelancer_proposed_price === undefined || freelancer_proposed_price === null) {
        throw new AppError("freelancer_proposed_price is required.", 400);
    }
    if (isNaN(freelancer_proposed_price) || Number(freelancer_proposed_price) <= 0) {
        throw new AppError("freelancer_proposed_price must be a positive number.", 400);
    }

    try {
        await bookingModel.updateFreelancerProposedPrice(
            parseInt(req.params.id, 10),
            req.user.freelancer_id,
            Number(freelancer_proposed_price)
        );
    } catch (err) {
        if (err.message === "NOT_FOUND") throw new AppError("Booking request not found.", 404);
        if (err.message === "INVALID_STATUS")
            throw new AppError("Only pending booking requests can be updated.", 400);
        if (err.message === "UNAUTHORIZED")
            throw new AppError("You can only update requests made to you.", 403);
        throw err;
    }

    res.json({ success: true, message: "Service price sent successfully." });
});
 
// ─────────────────────────────────────────────
// REJECT
// ─────────────────────────────────────────────
exports.reject = asyncHandler(async (req, res) => {
    const booking = await bookingModel.getById(req.params.id);
    if (!booking) throw new AppError("Booking request not found.", 404);
 
    if (booking.status !== "pending") {
        throw new AppError("Only pending booking requests can be rejected.", 400);
    }
    if (booking.freelancer_id !== req.user.freelancer_id) {
        throw new AppError("Unauthorized. You can only reject requests made to you.", 403);
    }
 
    await bookingModel.updateStatus(req.params.id, "rejected");
    res.json({ success: true, message: "Booking request rejected." });
});
 
// ─────────────────────────────────────────────
// CANCEL
// ─────────────────────────────────────────────
exports.cancel = asyncHandler(async (req, res) => {
    const booking = await bookingModel.getById(req.params.id);
    if (!booking) throw new AppError("Booking request not found.", 404);
 
    if (booking.status !== "pending") {
        throw new AppError("Only pending booking requests can be cancelled.", 400);
    }
    if (booking.customer_id !== req.user.customer_id) {
        throw new AppError("Unauthorized. You can only cancel your own requests.", 403);
    }
 
    await bookingModel.updateStatus(req.params.id, "cancelled");
    res.json({ success: true, message: "Booking request cancelled." });
});
 
// ─────────────────────────────────────────────
// COMPLETE
// ─────────────────────────────────────────────
exports.complete = asyncHandler(async (req, res) => {
    const booking = await bookingModel.getById(req.params.id);
    if (!booking) throw new AppError("Booking request not found.", 404);
 
    if (booking.status !== "accepted") {
        throw new AppError("Only accepted bookings can be marked as completed.", 400);
    }
    if (booking.freelancer_id !== req.user.freelancer_id) {
        throw new AppError("Unauthorized. You can only complete your own bookings.", 403);
    }
 
    await bookingModel.updateStatus(req.params.id, "completed");
    res.json({ success: true, message: "Booking marked as completed." });
});
 
// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
exports.delete = asyncHandler(async (req, res) => {
    const booking = await bookingModel.getById(req.params.id);
    if (!booking) throw new AppError("Booking request not found.", 404);
 
    if (booking.status !== "pending") {
        throw new AppError("Only pending booking requests can be deleted.", 400);
    }
    if (booking.customer_id !== req.user.customer_id) {
        throw new AppError("Unauthorized. You can only delete your own requests.", 403);
    }
 
    await bookingModel.delete(req.params.id);
    res.json({ success: true, message: "Booking request deleted." });
});
