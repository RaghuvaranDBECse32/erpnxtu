/**
 * server.js – entry point.
 * Loads environment variables and starts the HTTP server in local mode,
 * while exporting the Express app instance for Vercel serverless deployment.
 */
require("dotenv").config();

const app = require("./src/app");

const PORT = process.env.PORT || 5000;

// If not running inside Vercel serverless environment, start standalone HTTP server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[server] ERPNext Leave API running on http://localhost:${PORT}`);
    console.log(`[server] Environment : ${process.env.NODE_ENV || "development"}`);
  });
}

module.exports = app;
