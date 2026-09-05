/**
 * server.js — RecoverAI entry point.
 * Loads env, initialises Exasol connection, starts Express server.
 * Exports app for Vercel serverless deployment.
 */
require("dotenv").config();

const app = require("./src/app");
const { initExasol } = require("./src/database/exasol");

const PORT = process.env.PORT || 5000;

async function start() {
  // Attempt Exasol connection (non-blocking — falls back gracefully)
  await initExasol();

  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      const env = require("./src/config/env");
      console.log(`\n╔══════════════════════════════════════╗`);
      console.log(`║  RecoverAI — AI Revenue Recovery     ║`);
      console.log(`╚══════════════════════════════════════╝`);
      console.log(`  Server  : http://localhost:${PORT}`);
      console.log(`  Mode    : ${env.DEMO_MODE ? "DEMO (no real credentials)" : "LIVE"}`);
      console.log(`  DB      : ${require("./src/database/exasol").getMode()}`);
      console.log(`  Razorpay: ${env.RAZORPAY_KEY_ID ? "configured" : "demo"}\n`);
    });
  }
}

start();

module.exports = app;
