const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const reviewModel = require("../models/reviewModel");
const bookingModel = require("../models/bookingModel");
const freelancerModel = require("../models/freelancerModel");
const pool = require("../config/db");
const { requireFields } = require("../utils/validators");
 
// ─────────────────────────────────────────────
// CREATE REVIEW
// ─────────────────────────────────────────────
exports.create = asyncHandler(async (req, res) => {
    // roleMiddleware("customer") is applied in the route — only customers reach here.
    const { booking_id, rating, comments } = req.body;
 
    requireFields(req.body, ["booking_id", "rating"]);
 
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        throw new AppError("Rating must be an integer between 1 and 5.", 400);
    }
 
    // booking_id here is booking_request.request_id (what customers know as their booking ID).
    // We load the request to validate status and ownership.
    const bookingRequest = await bookingModel.getById(booking_id);
    if (!bookingRequest) {
        throw new AppError("Booking not found.", 404);
    }
    if (bookingRequest.status !== "completed") {
        throw new AppError("You can only leave a review after a booking is completed.", 400);
    }
    if (bookingRequest.customer_id !== req.user.customer_id) {
        throw new AppError("Unauthorized. You can only review your own bookings.", 403);
    }
 
    // The review table's FK references booking.booking_id (the confirmed booking row),
    // not booking_request.request_id. Resolve it here.
    const [bookingRows] = await pool.execute(
        `SELECT booking_id FROM booking WHERE request_id = ?`,
        [booking_id]
    );
    if (!bookingRows || bookingRows.length === 0) {
        throw new AppError(
            "No confirmed booking record found for this request. Cannot leave a review.",
            404
        );
    }
    const confirmedBookingId = bookingRows[0].booking_id;
 
    // Enforce one review per booking (UNIQUE KEY on booking_id in review table)
    const existing = await reviewModel.getByBookingId(confirmedBookingId);
    if (existing) {
        throw new AppError("A review already exists for this booking.", 409);
    }
 
    const reviewId = await reviewModel.create({
        booking_id: confirmedBookingId,
        freelancer_id: bookingRequest.freelancer_id,
        rating: ratingNum,
        comments: comments ? comments.trim() : null,
    });

    await reviewModel.updateFreelancerRating(bookingRequest.freelancer_id);
 
    res.status(201).json({
        success: true,
        message: "Review submitted successfully.",
        review_id: reviewId,
    });
});
 
// ─────────────────────────────────────────────
// GET REVIEW BY ID
// ─────────────────────────────────────────────
exports.get = asyncHandler(async (req, res) => {
    const data = await reviewModel.getById(req.params.id);
    if (!data) throw new AppError("Review not found.", 404);
    res.json({ success: true, data });
});
 
// ─────────────────────────────────────────────
// UPDATE REVIEW
// ─────────────────────────────────────────────
exports.update = asyncHandler(async (req, res) => {
    const review = await reviewModel.getById(req.params.id);
    if (!review) throw new AppError("Review not found.", 404);
 
    // customer_id is fetched via JOIN in reviewModel.getById — used for ownership check
    if (review.customer_id !== req.user.customer_id) {
        throw new AppError("Unauthorized. You can only update your own reviews.", 403);
    }
 
    const { rating, comments } = req.body;
 
    if (rating === undefined && comments === undefined) {
        throw new AppError("No fields to update. Provide at least rating or comments.", 400);
    }
 
    if (rating !== undefined) {
        const ratingNum = Number(rating);
        if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            throw new AppError("Rating must be an integer between 1 and 5.", 400);
        }
    }
 
    await reviewModel.update(req.params.id, review.freelancer_id, { rating, comments });
    const freelancer_id = review.freelancer_id;
    await reviewModel.updateFreelancerRating(freelancer_id);
 
    res.json({ success: true, message: "Review updated successfully." });
});
 
// ─────────────────────────────────────────────
// DELETE REVIEW
// ─────────────────────────────────────────────
exports.delete = asyncHandler(async (req, res) => {
    const review = await reviewModel.getById(req.params.id);

    if (!review) throw new AppError("Review not found.", 404);

    if (review.customer_id !== req.user.customer_id) {
        throw new AppError("Unauthorized. You can only delete your own reviews.", 403);
    }

    // ✅ FIX: define freelancer_id
    const freelancer_id = review.freelancer_id;

    await reviewModel.delete(req.params.id);
    await reviewModel.updateFreelancerRating(freelancer_id);

    res.json({ success: true, message: "Review deleted successfully." });
});
 
// ─────────────────────────────────────────────
// GET ALL REVIEWS BY FREELANCER
// ─────────────────────────────────────────────
exports.getByFreelancer = asyncHandler(async (req, res) => {
    const data = await reviewModel.getByFreelancer(req.params.freelancerId);
    res.json({ success: true, count: data.length, data });
});
 
// ─────────────────────────────────────────────
// GET AVERAGE RATING FOR A FREELANCER
// ─────────────────────────────────────────────

exports.getAverage = asyncHandler(async (req, res) => {
    const data = await reviewModel.getAverage(req.params.freelancerId);
    const freelancer = await freelancerModel.getById(req.params.freelancerId);
    if (!freelancer) {
        throw new AppError("Freelancer not found.", 404);
    }
    res.json({
        success: true,
        freelancer_id: parseInt(req.params.freelancerId, 10),
        avg_rating: parseFloat(data.avg_rating) || 0,
        total_reviews: parseInt(data.total_reviews, 10) || 0,
    });
});
 
// ─────────────────────────────────────────────
// GET TOP 5 FREELANCERS BY RATING
// ─────────────────────────────────────────────
exports.getTop = asyncHandler(async (req, res) => {
    const data = await reviewModel.getTop();
    res.json({ success: true, data });
});