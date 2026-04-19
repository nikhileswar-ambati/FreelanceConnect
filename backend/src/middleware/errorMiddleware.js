const AppError = require("../utils/AppError");
 
/**
 * Global Express error handler.
 * Distinguishes between known operational errors (AppError) and
 * unexpected bugs, and returns appropriate responses.
 */
module.exports = (err, req, res, next) => {
    // Always log the full error on the server side
    console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${err.message}`);
    if (process.env.NODE_ENV === "development") {
        console.error(err.stack);
    }
 
    // Handle specific MySQL/DB errors gracefully
    if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            success: false,
            message: "A record with this value already exists.",
        });
    }
 
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
            success: false,
            message: "Referenced record does not exist. Check your foreign key values.",
        });
    }
 
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
            success: false,
            message: "Cannot delete this record because it is referenced by other data.",
        });
    }
 
    // JWT errors (in case they bypass authMiddleware)
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ success: false, message: "Invalid token." });
    }
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }
 
    // Known operational errors thrown via AppError
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }
 
    // Unknown / programmer errors — don't leak details in production
    const statusCode = err.statusCode || 500;
    const message =
        process.env.NODE_ENV === "development"
            ? err.message
            : "Something went wrong. Please try again later.";
 
    return res.status(statusCode).json({ success: false, message });
};