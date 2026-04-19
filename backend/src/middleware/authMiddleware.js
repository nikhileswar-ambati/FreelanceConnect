const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
 
/**
 * Verifies the JWT Bearer token from the Authorization header.
 * On success, attaches the decoded payload to req.user.
 * Payload contains: { id, user_id, role, customer_id, freelancer_id }
 */
module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
 
        if (!authHeader) {
            return next(new AppError("Access denied. No token provided.", 401));
        }
 
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return next(new AppError("Invalid token format. Use: Bearer <token>", 401));
        }
 
        const token = parts[1];
        if (!token) {
            return next(new AppError("Access denied. Token is empty.", 401));
        }
 
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return next(new AppError("Session expired. Please log in again.", 401));
        }
        return next(new AppError("Invalid token. Authentication failed.", 401));
    }
};
