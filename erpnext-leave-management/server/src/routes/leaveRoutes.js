const { Router } = require("express");
const { getLeaves, createLeave } = require("../controllers/leaveController");
const { validateRequest, leaveApplicationSchema } = require("../middleware/validateRequest");

const router = Router();

// GET /api/leaves
router.get("/", getLeaves);

// POST /api/leaves – validate body before hitting ERPNext
router.post("/", validateRequest(leaveApplicationSchema), createLeave);

module.exports = router;
