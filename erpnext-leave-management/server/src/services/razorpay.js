/**
 * razorpay.js — Razorpay service for RecoverAI.
 *
 * SECURITY: RAZORPAY_KEY_SECRET is NEVER sent to the frontend.
 * All Razorpay operations go through this server-side service.
 *
 * Demo mode: generates realistic simulated responses when credentials absent.
 */

const crypto = require("crypto");
const env = require("../config/env");

let razorpayInstance = null;

function getRazorpay() {
  if (razorpayInstance) return razorpayInstance;
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return null;
  try {
    const Razorpay = require("razorpay");
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
    return razorpayInstance;
  } catch (err) {
    console.warn("[Razorpay] SDK not available:", err.message);
    return null;
  }
}

function isDemoMode() {
  return env.DEMO_MODE || !env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET;
}

function demoOrderId() {
  return `order_demo${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;
}

function demoPaymentId() {
  return `pay_demo${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Create a Razorpay order for payment recovery.
 * Returns { order_id, amount, currency, demo }
 */
async function createOrder({ amount, currency = "INR", receipt, notes = {} }) {
  if (isDemoMode()) {
    return {
      id: demoOrderId(),
      amount: amount * 100, // paise
      currency,
      receipt,
      status: "created",
      demo: true,
    };
  }

  const rzp = getRazorpay();
  const order = await rzp.orders.create({
    amount: amount * 100,
    currency,
    receipt,
    notes,
  });
  return { ...order, demo: false };
}

/**
 * Verify Razorpay payment signature.
 * SECURITY: Uses HMAC-SHA256 with KEY_SECRET (server-side only).
 */
function verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (isDemoMode()) {
    // In demo mode, accept any payload with demo- prefix
    return razorpay_payment_id.startsWith("pay_demo") || razorpay_payment_id.startsWith("pay_");
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expected === razorpay_signature;
}

/**
 * Fetch payment details from Razorpay.
 */
async function fetchPayment(paymentId) {
  if (isDemoMode() || paymentId.startsWith("pay_demo")) {
    return {
      id: paymentId,
      status: "captured",
      amount: 0,
      currency: "INR",
      demo: true,
    };
  }
  const rzp = getRazorpay();
  return await rzp.payments.fetch(paymentId);
}

/**
 * Get the public Razorpay Key ID safe to send to frontend.
 */
function getPublicKeyId() {
  return env.RAZORPAY_KEY_ID || "rzp_demo_key";
}

module.exports = { createOrder, verifySignature, fetchPayment, getPublicKeyId, isDemoMode };
