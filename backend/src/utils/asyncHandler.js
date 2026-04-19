/**
 * Wraps async route handlers to automatically forward errors to Express's
 * error handling middleware instead of requiring try/catch in every controller.
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
 
module.exports = asyncHandler;