/**
 * env.js — Centralised environment variable access for RecoverAI.
 * Application runs in DEMO_MODE when real credentials are absent.
 */

const DEMO_MODE =
  process.env.DEMO_MODE === "true" || process.env.PAYMENT_MODE === "demo";

if (!DEMO_MODE) {
  const WARN_VARS = [
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "EXASOL_HOST",
  ];
  for (const v of WARN_VARS) {
    if (!process.env[v]) {
      console.warn(
        `[env] WARNING – ${v} not set. Running in DEMO_MODE for this service.`
      );
    }
  }
}

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",

  // Exasol Personal
  EXASOL_HOST: process.env.EXASOL_HOST || "",
  EXASOL_PORT: parseInt(process.env.EXASOL_PORT, 10) || 8563,
  EXASOL_USER: process.env.EXASOL_USER || "sys",
  EXASOL_PASSWORD: process.env.EXASOL_PASSWORD || "",
  EXASOL_DATABASE: process.env.EXASOL_DATABASE || "RECOVERAI",

  // AI (optional)
  AI_API_KEY: process.env.AI_API_KEY || "",

  // Mode
  DEMO_MODE,
  PAYMENT_MODE: process.env.PAYMENT_MODE || (DEMO_MODE ? "demo" : "live"),
};
