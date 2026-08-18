const { Router } = require("express");
const { getEmployees } = require("../controllers/employeeController");

const router = Router();

// GET /api/employees
router.get("/", getEmployees);

module.exports = router;
