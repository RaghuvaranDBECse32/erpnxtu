/**
 * errorHandler.js – centralized Express error middleware.
 *
 * Must be registered AFTER all routes (app.use(errorHandler)).
 * Hides stack traces and ERPNext internals in production.
 */

const { NODE_ENV } = require("../config/env");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  // Default message
  let message = err.message || "An unexpected error occurred";

  // Provide friendlier messages for well-known ERPNext error patterns
  if (err.erpnext) {
    if (message.toLowerCase().includes("insufficient leave balance")) {
      message = "Insufficient leave balance for the selected leave type.";
    } else if (
      message.toLowerCase().includes("leave type") &&
      message.toLowerCase().includes("not found")
    ) {
      message =
        "The selected leave type was not found in ERPNext. Ensure a Leave Type and Leave Allocation exist for this employee.";
    } else if (
      message.toLowerCase().includes("permission") ||
      message.toLowerCase().includes("not permitted")
    ) {
      message =
        "Permission denied. The integration user may not have access to this DocType or document.";
    } else if (
      message.toLowerCase().includes("employee") &&
      message.toLowerCase().includes("not found")
    ) {
      message = "Employee not found. Verify the Employee ID exists in ERPNext.";
    } else if (status === 401 || status === 403) {
      message =
        "ERPNext authentication failed. Check ERP_API_KEY and ERP_API_SECRET in server environment variables.";
    }
  }

  // Only expose stack traces during development
  const response = {
    success: false,
    message,
    ...(NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(status).json(response);
};

module.exports = errorHandler;
