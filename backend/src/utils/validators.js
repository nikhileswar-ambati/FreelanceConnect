/**
 * Shared validation helpers used across controllers.
 */
 
const AppError = require("./AppError");
 
/** Validates HH:MM:SS time format */
const isValidTime = (val) => {
    if (!/^\d{2}:\d{2}:\d{2}$/.test(val)) return false;

    const [hh, mm, ss] = val.split(":").map(Number);

    return (
        hh >= 0 && hh <= 23 &&
        mm >= 0 && mm <= 59 &&
        ss >= 0 && ss <= 59
    );
};
/** Validates YYYY-MM-DD date format and actual calendar validity */
const isValidDate = (val) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;

    const [year, month, day] = val.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
};
 
/** Validates a positive integer (from query string or body) */
const isPositiveInt = (val) => Number.isInteger(Number(val)) && Number(val) > 0;
 
/** Asserts required fields are present in an object; throws AppError if not */
const requireFields = (obj, fields) => {
    const missing = fields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === "");
    if (missing.length > 0) {
        throw new AppError(`Missing required fields: ${missing.join(", ")}`, 400);
    }
};
 
/** Parses and validates a pagination query — returns { page, limit, offset } */
const parsePagination = (query) => {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
 
    if (!Number.isInteger(page) || page < 1)
        throw new AppError("Invalid page number. Must be a positive integer.", 400);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50)
        throw new AppError("Invalid limit. Must be between 1 and 50.", 400);
 
    return { page, limit, offset: (page - 1) * limit };
};
 
module.exports = { isValidTime, isValidDate, isPositiveInt, requireFields, parsePagination };
