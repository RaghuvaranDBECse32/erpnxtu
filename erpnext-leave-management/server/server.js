/**
 * server.js – entry point.
 * Loads environment variables before anything else, then starts the HTTP server.
 */
require("dotenv").config();

const app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[server] ERPNext Leave API running on http://localhost:${PORT}`);
  console.log(`[server] Environment : ${process.env.NODE_ENV || "development"}`);
});
