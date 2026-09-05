/**
 * audit.js — Audit trail routes for RecoverAI.
 * GET  /api/audit          — full audit log
 * GET  /api/audit/:payId   — audit log for specific payment
 */

const express = require("express");
const router = express.Router();
const db = require("../database/exasol");

// GET /api/audit
router.get("/", async (req, res) => {
  try {
    const logs = await db.getAuditLogs();
    res.json({ success: true, data: logs, total: logs.length, mode: db.getMode() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/audit/:paymentId
router.get("/:paymentId", async (req, res) => {
  try {
    const logs = await db.getAuditLogs(req.params.paymentId);
    res.json({ success: true, data: logs, total: logs.length, mode: db.getMode() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
