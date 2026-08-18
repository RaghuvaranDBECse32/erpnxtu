/**
 * leaveController.js
 * Handles GET /api/leaves and POST /api/leaves.
 */

const { getList, createDoc } = require("../services/erpnextService");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GET /api/leaves
 * Returns the 50 most recently created leave applications.
 */
const getLeaves = asyncHandler(async (req, res) => {
  const fields = JSON.stringify([
    "name",
    "employee",
    "employee_name",
    "leave_type",
    "from_date",
    "to_date",
    "total_leave_days",
    "status",
    "reason",
    "creation",
  ]);

  const leaves = await getList("Leave Application", {
    fields,
    limit_page_length: 50,
    order_by: "creation desc",
  });

  res.json({
    success: true,
    count: leaves.length,
    data: leaves,
  });
});

/**
 * POST /api/leaves
 * Creates a new Leave Application in ERPNext.
 * The request body has already been validated by validateRequest middleware;
 * use req.validatedBody instead of req.body.
 */
const createLeave = asyncHandler(async (req, res) => {
  const { employee, leave_type, from_date, to_date, reason } = req.validatedBody;

  const newDoc = await createDoc({
    doctype: "Leave Application",
    employee,
    leave_type,
    from_date,
    to_date,
    reason,
    // "Open" is the ERPNext default status for a freshly submitted application.
    // ERPNext workflow will move it to Approved/Rejected based on leave policy.
    status: "Open",
  });

  res.status(201).json({
    success: true,
    message: "Leave application submitted successfully",
    data: newDoc,
  });
});

module.exports = { getLeaves, createLeave };
