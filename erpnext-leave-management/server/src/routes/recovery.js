/**
 * recovery.js — Recovery Agent routes for RecoverAI.
 * POST /api/recovery/analyze/:id  — run AI analysis on a payment
 * POST /api/recovery/execute/:id  — execute the chosen recovery action
 * GET  /api/recovery/cases        — list all active recovery cases
 */

const express = require("express");
const router = express.Router();
const db = require("../database/exasol");
const agent = require("../services/recoveryAgent");

// GET /api/recovery/cases
router.get("/cases", async (req, res) => {
  try {
    const all = await db.getPayments();
    const cases = all.filter(
      (p) =>
        (p.payment_status === "FAILED" || p.payment_status === "ABANDONED") &&
        p.recovery_status !== "NOT_REQUIRED"
    );
    res.json({ success: true, data: cases, total: cases.length, mode: db.getMode() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/recovery/analyze/:id
router.post("/analyze/:id", async (req, res) => {
  try {
    const payment = await db.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    const analysis = await agent.analyzePayment(payment);

    // Update probability in DB
    await db.updatePayment(payment.payment_id, {
      recovery_probability: analysis.probability,
    });

    // Log analysis event
    await db.insertAuditLog({
      log_id: `LOG-${Date.now()}`,
      payment_id: payment.payment_id,
      event: "AGENT_ANALYSIS",
      agent_action: analysis.action,
      probability: analysis.probability,
      reason: analysis.reason,
      result: analysis.shouldStop ? "STOPPED" : "ANALYZED",
      amount_recovered: 0,
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      payment,
      analysis,
      mode: db.getMode(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/recovery/execute/:id
router.post("/execute/:id", async (req, res) => {
  try {
    const payment = await db.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    // Re-analyze for fresh decision
    const analysis = await agent.analyzePayment(payment);

    if (analysis.shouldStop) {
      await db.updatePayment(payment.payment_id, { recovery_status: "STOPPED" });
      await db.insertAuditLog({
        log_id: `LOG-${Date.now()}`,
        payment_id: payment.payment_id,
        event: "RECOVERY_STOPPED",
        agent_action: "STOP",
        probability: analysis.probability,
        reason: analysis.reason,
        result: "STOPPED",
        amount_recovered: 0,
        created_at: new Date().toISOString(),
      });

      return res.json({
        success: true,
        stopped: true,
        reason: analysis.reason,
        analysis,
        mode: db.getMode(),
      });
    }

    // Execute recovery
    const result = await agent.executeRecovery(payment, analysis);

    // Persist outcome
    const updates = {
      recovery_status: result.newRecoveryStatus,
      attempt_count: result.newAttemptCount || payment.attempt_count + 1,
    };
    if (result.success) {
      updates.payment_status = "RECOVERED";
    }
    await db.updatePayment(payment.payment_id, updates);

    // Audit log
    await db.insertAuditLog({
      log_id: `LOG-${Date.now()}`,
      payment_id: payment.payment_id,
      event: result.success ? "RECOVERY_SUCCESS" : "RECOVERY_FAILED",
      agent_action: analysis.action,
      probability: analysis.probability,
      reason: analysis.reason,
      result: result.success ? "RECOVERED" : "FAILED",
      amount_recovered: result.amountRecovered,
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      recovered: result.success,
      amountRecovered: result.amountRecovered,
      analysis,
      result,
      mode: db.getMode(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
