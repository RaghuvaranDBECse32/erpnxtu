/**
 * app.js — RecoverAI Core Express application.
 * Autonomous AI Revenue Recovery API server.
 */

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const paymentsRoutes = require("./routes/payments");
const analyticsRoutes = require("./routes/analytics");
const recoveryRoutes = require("./routes/recovery");
const auditRoutes = require("./routes/audit");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Raw body for Razorpay webhook (before express.json)
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  const env = require("./config/env");
  const db = require("./database/exasol");
  res.json({
    ok: true,
    service: "RecoverAI — AI Revenue Recovery Agent",
    version: "1.0.0",
    mode: env.DEMO_MODE ? "demo" : "live",
    database: db.getMode(),
    razorpay: env.RAZORPAY_KEY_ID ? "configured" : "demo",
    exasol: db.isConnected() ? "connected" : "fallback",
    timestamp: new Date().toISOString(),
  });
});

// RecoverAI Routes
app.use("/api/payments", paymentsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/recovery", recoveryRoutes);
app.use("/api/audit", auditRoutes);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[RecoverAI Error]", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
