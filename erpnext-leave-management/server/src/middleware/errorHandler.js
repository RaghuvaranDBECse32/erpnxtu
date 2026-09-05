/**
 * errorHandler.js – Centralized Express error middleware for RecoverAI.
 */

const env = require("../config/env");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected error occurred in RecoverAI engine";

  const response = {
    success: false,
    message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(status).json(response);
};

module.exports = errorHandler;
