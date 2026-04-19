const asyncHandler = require("../utils/asyncHandler");
const optionsModel = require("../models/optionsModel");

exports.locations = asyncHandler(async (req, res) => {
    const data = await optionsModel.getLocations();
    res.json({ success: true, count: data.length, data });
});

exports.skills = asyncHandler(async (req, res) => {
    const data = await optionsModel.getSkills();
    res.json({ success: true, count: data.length, data });
});

exports.availability = asyncHandler(async (req, res) => {
    const data = await optionsModel.getAvailability();
    res.json({ success: true, count: data.length, data });
});
