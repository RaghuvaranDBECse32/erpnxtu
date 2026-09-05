/**
 * payments.js — Payment routes for RecoverAI.
 * POST /api/payments/create-order
 * POST /api/payments/verify
 * POST /api/payments/webhook
 * GET  /api/payments
 * GET  /api/payments/:id
 */

const express = require("express");
const router = express.Router();
const db = require("../database/exasol");
const rzp = require("../services/razorpay");
const { calcProbability } = require("../services/recoveryAgent");

// GET /api/payments — list all with optional filters
router.get("/", async (req, res) => {
  try {
    const { status, recovery_status, search } = req.query;
    let payments = await db.getPayments({ status, recovery_status });

    if (search) {
      const q = search.toLowerCase();
      payments = payments.filter(
        (p) =>
          p.payment_id.toLowerCase().includes(q) ||
          p.customer_name.toLowerCase().includes(q) ||
          (p.failure_reason || "").toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: payments, total: payments.length, mode: db.getMode() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/payments/:id — single payment
router.get("/:id", async (req, res) => {
  try {
    const payment = await db.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    res.json({ success: true, data: payment, mode: db.getMode() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments/create-order — create Razorpay order for recovery
router.post("/create-order", async (req, res) => {
  try {
    const { payment_id } = req.body;
    if (!payment_id) return res.status(400).json({ success: false, message: "payment_id required" });

    const payment = await db.getPaymentById(payment_id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    const order = await rzp.createOrder({
      amount: payment.amount,
      currency: payment.currency || "INR",
      receipt: payment_id,
      notes: {
        payment_id,
        customer_name: payment.customer_name,
        recovery: "true",
      },
    });

    res.json({
      success: true,
      order,
      key_id: rzp.getPublicKeyId(),
      demo: rzp.isDemoMode(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments/verify — verify Razorpay signature after payment
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id } = req.body;

    const valid = rzp.verifySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!valid) {
      return res.status(400).json({ success: false, message: "Signature verification failed" });
    }

    // Update payment record
    await db.updatePayment(payment_id, {
      payment_status: "RECOVERED",
      recovery_status: "RECOVERED",
      razorpay_order_id,
      razorpay_payment_id,
    });

    // Log to audit
    const payment = await db.getPaymentById(payment_id);
    await db.insertAuditLog({
      log_id: `LOG-${Date.now()}`,
      payment_id,
      event: "PAYMENT_VERIFIED",
      agent_action: "RETRY_PAYMENT",
      probability: payment?.recovery_probability,
      reason: "Razorpay signature verified",
      result: "RECOVERED",
      amount_recovered: payment?.amount || 0,
      created_at: new Date().toISOString(),
    });

    res.json({ success: true, message: "Payment verified and recovered", payment_id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments/webhook — Razorpay webhook handler
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    // Webhook signature validation would go here in production
    const event = JSON.parse(req.body.toString());
    console.log("[Webhook] Razorpay event:", event.event);

    if (event.event === "payment.captured") {
      const paymentId = event.payload?.payment?.entity?.notes?.payment_id;
      if (paymentId) {
        await db.updatePayment(paymentId, {
          payment_status: "RECOVERED",
          recovery_status: "RECOVERED",
          razorpay_payment_id: event.payload?.payment?.entity?.id,
        });
      }
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("[Webhook] Error:", err.message);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

module.exports = router;
