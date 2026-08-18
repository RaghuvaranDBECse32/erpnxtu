/**
 * dashboardController.js
 * Aggregates employee + leave data into a single dashboard summary response.
 *
 * ERPNext note: freshly created leave applications have status "Open".
 * For UI purposes, Open and Pending are both treated as "pending-like".
 */

const { getList } = require("../services/erpnextService");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GET /api/dashboard
 * Returns aggregated statistics and 5 most-recent leave applications.
 */
const getDashboard = asyncHandler(async (req, res) => {
  // Run both ERPNext fetches in parallel for performance
  const [employees, leaves] = await Promise.all([
    getList("Employee", {
      fields: JSON.stringify(["name"]),
      filters: JSON.stringify([["Employee", "status", "=", "Active"]]),
      limit_page_length: 500,
    }),
    getList("Leave Application", {
      fields: JSON.stringify([
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
      ]),
      limit_page_length: 200,
      order_by: "creation desc",
    }),
  ]);

  // ------------------------------------------------------------------
  // Aggregate leave statistics
  // Open + Pending are both "pending-like" from the dashboard perspective.
  // ------------------------------------------------------------------
  const totalApplications = leaves.length;

  const pendingApplications = leaves.filter(
    (l) => l.status === "Open" || l.status === "Pending"
  ).length;

  const approvedApplications = leaves.filter(
    (l) => l.status === "Approved"
  ).length;

  const rejectedApplications = leaves.filter(
    (l) => l.status === "Rejected"
  ).length;

  // 5 most recent applications (already sorted desc by creation)
  const recentApplications = leaves.slice(0, 5);

  res.json({
    success: true,
    data: {
      totalEmployees: employees.length,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      recentApplications,
    },
  });
});

module.exports = { getDashboard };
