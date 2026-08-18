/**
 * asyncHandler.js – wraps async route handlers so unhandled promise
 * rejections are forwarded to Express's centralized error middleware
 * instead of crashing the process.
 *
 * Usage:
 *   router.get("/route", asyncHandler(async (req, res) => { ... }));
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
