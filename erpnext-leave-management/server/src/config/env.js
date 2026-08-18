/**
 * env.js – centralised environment variable access.
 * Validates at start-up so the server fails fast with a clear message
 * instead of silently hitting ERPNext with empty credentials.
 */

const REQUIRED_VARS = ["ERP_URL", "ERP_API_KEY", "ERP_API_SECRET"];

for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    console.error(`[env] FATAL – missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  ERP_URL: process.env.ERP_URL,
  ERP_API_KEY: process.env.ERP_API_KEY,
  ERP_API_SECRET: process.env.ERP_API_SECRET,
};
