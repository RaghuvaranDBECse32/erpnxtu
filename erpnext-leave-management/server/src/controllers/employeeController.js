/**
 * employeeController.js
 * Handles GET /api/employees – fetch active employees from ERPNext.
 */

const { getList } = require("../services/erpnextService");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GET /api/employees
 * Returns an array of active employees with selected fields only.
 */
const getEmployees = asyncHandler(async (req, res) => {
  // ERPNext filter syntax: array of [doctype, field, operator, value]
  const filters = JSON.stringify([["Employee", "status", "=", "Active"]]);

  const fields = JSON.stringify([
    "name",
    "employee_name",
    "department",
    "designation",
    "status",
  ]);

  const employees = await getList("Employee", {
    fields,
    filters,
    limit_page_length: 500, // fetch up to 500 active employees
    order_by: "employee_name asc",
  });

  res.json({
    success: true,
    count: employees.length,
    data: employees,
  });
});

module.exports = { getEmployees };
