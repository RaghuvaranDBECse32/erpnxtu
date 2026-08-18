/**
 * app.js – Express application factory.
 * Wires up security, logging, rate-limiting, routes, and error handling.
 */

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { CLIENT_URL, NODE_ENV } = require("./config/env");
const errorHandler = require("./middleware/errorHandler");

const employeeRoutes = require("./routes/employeeRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
app.use(helmet());

// ---------------------------------------------------------------------------
// CORS – only allow requests from the React dev server / deployed frontend
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ---------------------------------------------------------------------------
// Request logging (skip in test environments)
// ---------------------------------------------------------------------------
if (NODE_ENV !== "test") {
  app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));
}

// ---------------------------------------------------------------------------
// Body parser
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "10kb" }));

// ---------------------------------------------------------------------------
// Rate limiting – global limiter to protect ERPNext from excessive calls
// ---------------------------------------------------------------------------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // max 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
});

app.use("/api", apiLimiter);

// ---------------------------------------------------------------------------
// Health check – does NOT hit ERPNext; cheap liveness probe for load balancers
// ---------------------------------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ERPNext Leave Management API" });
});

// ---------------------------------------------------------------------------
// Feature routes
// ---------------------------------------------------------------------------
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ---------------------------------------------------------------------------
// 404 – unknown routes
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ---------------------------------------------------------------------------
// Centralized error handler (must be last middleware)
// ---------------------------------------------------------------------------
app.use(errorHandler);

module.exports = app;
