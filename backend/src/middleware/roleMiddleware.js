const AppError = require("../utils/AppError");
 
/**
 * Role-based access control middleware.
 * Usage: roleMiddleware("freelancer") or roleMiddleware("customer", "freelancer")
 * Must be used AFTER authMiddleware so that req.user is populated.
 */
module.exports = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return next(new AppError("Authentication required.", 401));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new AppError(
                    `Access denied. Only ${allowedRoles.join(" or ")} can perform this action.`,
                    403
                )
            );
        }
        next();
    };
};