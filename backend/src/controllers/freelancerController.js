const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const freelancerModel = require("../models/freelancerModel");
const availabilityModel = require("../models/availabilityModel");
const { requireFields, isValidDate, parsePagination } = require("../utils/validators");
const { filterPastSlots, isPastDate, isPastSlot } = require("../utils/dateTime");
 
// ─────────────────────────────────────────────
// CREATE PROFILE
// ─────────────────────────────────────────────
exports.create = asyncHandler(async (req, res) => {
    // roleMiddleware ensures only 'freelancer' reaches here
    const { experience, bio, starting_price, skill_id } = req.body;
 
    requireFields(req.body, ["starting_price", "skill_id"]);
 
    if (starting_price <= 0) {
        throw new AppError("starting_price must be a positive number.", 400);
    }
    if (experience !== undefined && (!Number.isInteger(Number(experience)) || Number(experience) < 0)) {
        throw new AppError("experience must be a non-negative integer (years).", 400);
    }
 
    // Check if this user already has a profile
    // (The DB has a UNIQUE KEY on user_id, so we surface a readable error)
    const freelancerId = await freelancerModel.create({
        user_id: req.user.id,
        experience: experience ?? null,
        bio: bio ? bio.trim() : null,
        starting_price,
        skill_id,
    });
 
    res.status(201).json({
        success: true,
        message: "Freelancer profile created successfully.",
        freelancer_id: freelancerId,
    });
});

exports.setAvailability = asyncHandler(async (req, res) => {
    const { date, available_slots } = req.body;

    requireFields(req.body, ["date", "available_slots"]);

    if (!req.user.freelancer_id) {
        throw new AppError("Freelancer profile not found.", 400);
    }
    if (!isValidDate(date)) {
        throw new AppError("Invalid date format. Use YYYY-MM-DD.", 400);
    }
    if (isPastDate(date)) {
        throw new AppError("Cannot set availability for a past date.", 400);
    }
    if (!Array.isArray(available_slots)) {
        throw new AppError("available_slots must be an array.", 400);
    }

    const normalizedSlots = [...new Set(available_slots.map(Number))];
    const invalid = normalizedSlots.some(
        (hour) => !Number.isInteger(hour) || hour < 0 || hour > 23
    );

    if (invalid) {
        throw new AppError("available_slots must contain integers from 0 to 23.", 400);
    }
    if (normalizedSlots.some((hour) => isPastSlot(date, hour))) {
        throw new AppError("Cannot set availability for past time slots.", 400);
    }

    await availabilityModel.setForDate({
        freelancer_id: req.user.freelancer_id,
        date,
        available_slots: normalizedSlots,
    });

    res.status(201).json({
        success: true,
        message: "Availability saved successfully.",
        freelancer_id: req.user.freelancer_id,
        date,
        available_slots: normalizedSlots,
    });
});

exports.getAvailability = asyncHandler(async (req, res) => {
    const freelancer_id = parseInt(req.params.id, 10);
    const { date } = req.query;

    if (isNaN(freelancer_id) || freelancer_id < 1) {
        throw new AppError("Invalid freelancer ID.", 400);
    }
    if (!date) {
        throw new AppError("Query parameter 'date' is required (YYYY-MM-DD).", 400);
    }
    if (!isValidDate(date)) {
        throw new AppError("Invalid date format. Use YYYY-MM-DD.", 400);
    }

    const profile = await freelancerModel.getById(freelancer_id);
    if (!profile) throw new AppError("Freelancer profile not found.", 404);

    const available_slots = await availabilityModel.getAvailableSlots({
        freelancer_id,
        date,
    });

    res.json({ success: true, available_slots: filterPastSlots(date, available_slots) });
});
 
// ─────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────
exports.get = asyncHandler(async (req, res) => {
    const profile = await freelancerModel.getById(req.params.id);
    if (!profile) throw new AppError("Freelancer profile not found.", 404);
 
    res.json({ success: true, data: profile });
});
 
// ─────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────
exports.update = asyncHandler(async (req, res) => {
    const profile = await freelancerModel.getById(req.params.id);
    if (!profile) throw new AppError("Freelancer profile not found.", 404);
 
    // Ownership check: the logged-in user must own this profile
    if (profile.user_id !== req.user.id) {
        throw new AppError("Unauthorized. You can only update your own profile.", 403);
    }
 
    const { experience, bio, starting_price } = req.body;
 
    // At least one field must be provided
    if (experience === undefined && bio === undefined && starting_price === undefined) {
        throw new AppError("No updatable fields provided. Send experience, bio, or starting_price.", 400);
    }
 
    if (starting_price !== undefined && starting_price <= 0) {
        throw new AppError("starting_price must be a positive number.", 400);
    }
    if (experience !== undefined && (!Number.isInteger(Number(experience)) || Number(experience) < 0)) {
        throw new AppError("experience must be a non-negative integer (years).", 400);
    }
 
    await freelancerModel.update(req.params.id, { experience, bio, starting_price });
 
    res.json({ success: true, message: "Profile updated successfully." });
});
 
// ─────────────────────────────────────────────
// DELETE PROFILE
// ─────────────────────────────────────────────
exports.delete = asyncHandler(async (req, res) => {
    const profile = await freelancerModel.getById(req.params.id);
    if (!profile) throw new AppError("Freelancer profile not found.", 404);
 
    if (profile.user_id !== req.user.id) {
        throw new AppError("Unauthorized. You can only delete your own profile.", 403);
    }
 
    await freelancerModel.delete(req.params.id);
 
    res.json({ success: true, message: "Freelancer profile deleted successfully." });
});
 
// ─────────────────────────────────────────────
// SEARCH FREELANCERS
// ─────────────────────────────────────────────
exports.search = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);

    if (isNaN(limit) || isNaN(offset)) {
        throw new AppError("Invalid pagination values.", 400);
    }
 
    const location_id = req.query.location_id ? parseInt(req.query.location_id, 10) : null;
    const skill_id = req.query.skill_id ? parseInt(req.query.skill_id, 10) : null;
    const min_experience = req.query.min_experience !== undefined
        ? parseInt(req.query.min_experience, 10)
        : null;
 
    if (req.query.location_id && isNaN(location_id))
        throw new AppError("location_id must be a valid integer.", 400);
    if (req.query.skill_id && isNaN(skill_id))
        throw new AppError("skill_id must be a valid integer.", 400);
    if (req.query.min_experience !== undefined && isNaN(min_experience))
        throw new AppError("min_experience must be a valid integer.", 400);
 
    const data = await freelancerModel.search({
        location_id,
        skill_id,
        min_experience,
        limit,
        offset,
    });
 
    res.json({
        success: true,
        page,
        limit,
        count: data.length,
        message: data.length === 0 ? "No freelancers found matching your criteria." : undefined,
        data,
    });
});
 
// ─────────────────────────────────────────────
// GET SCHEDULE (Available / Booked Slots)
// ─────────────────────────────────────────────
exports.getSchedule = asyncHandler(async (req, res) => {
    const freelancer_id = parseInt(req.params.id, 10);
    const { date } = req.query;
 
    if (isNaN(freelancer_id) || freelancer_id < 1) {
        throw new AppError("Invalid freelancer ID.", 400);
    }
    if (!date) {
        throw new AppError("Query parameter 'date' is required (YYYY-MM-DD).", 400);
    }
    if (!isValidDate(date)) {
        throw new AppError("Invalid date format. Use YYYY-MM-DD.", 400);
    }
 
    // Verify the freelancer actually exists
    const profile = await freelancerModel.getById(freelancer_id);
    if (!profile) throw new AppError("Freelancer not found.", 404);
 
    const available_slots = await availabilityModel.getAvailableSlots({
        freelancer_id,
        date,
    });
 
    res.json({
        success: true,
        freelancer_id,
        date,
        available_slots: filterPastSlots(date, available_slots),
    });
});
