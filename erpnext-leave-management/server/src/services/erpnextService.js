/**
 * erpnextService.js – reusable Axios client for the Frappe/ERPNext REST API.
 *
 * All calls go through `/api/resource` using token-based authentication.
 * Credentials are read exclusively from environment variables; they are
 * NEVER forwarded to the React frontend.
 */

const axios = require("axios");
const { ERP_URL, ERP_API_KEY, ERP_API_SECRET } = require("../config/env");

// ---------------------------------------------------------------------------
// Axios instance – one client shared across all controllers
// ---------------------------------------------------------------------------
const erpClient = axios.create({
  baseURL: `${ERP_URL}/api/resource`,
  timeout: 18000, // 18 s – generous enough for Frappe Cloud cold starts
  headers: {
    "Content-Type": "application/json",
    // ERPNext token auth: "token <api_key>:<api_secret>"
    Authorization: `token ${ERP_API_KEY}:${ERP_API_SECRET}`,
  },
});

// ---------------------------------------------------------------------------
// Response interceptor – normalise ERPNext error shapes
// ---------------------------------------------------------------------------
erpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // ERPNext wraps errors in { exc_type, exception, message, ... }
    const erpMessage =
      error.response?.data?.message ||
      error.response?.data?.exception ||
      error.message ||
      "ERPNext request failed";

    const status = error.response?.status || 500;

    // Build a clean error that controllers can safely forward to the client
    const cleanError = new Error(erpMessage);
    cleanError.status = status;
    cleanError.erpnext = true; // flag so the global handler formats it properly

    return Promise.reject(cleanError);
  }
);

// ---------------------------------------------------------------------------
// Helper – build ERPNext filter array from a plain object
// e.g. { status: "Active" } → [["Employee","status","=","Active"]]
// ---------------------------------------------------------------------------
function buildFilters(doctype, filterObj) {
  return Object.entries(filterObj).map(([field, value]) => [
    doctype,
    field,
    "=",
    value,
  ]);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a list of documents from ERPNext.
 * @param {string} doctype  e.g. "Employee"
 * @param {object} params   query-string params forwarded to /api/resource/:doctype
 */
async function getList(doctype, params = {}) {
  const response = await erpClient.get(`/${doctype}`, { params });
  // ERPNext list endpoint returns { data: [...] }
  return response.data.data;
}

/**
 * Fetch a single document by name.
 */
async function getDoc(doctype, name) {
  const response = await erpClient.get(`/${doctype}/${encodeURIComponent(name)}`);
  return response.data.data;
}

/**
 * Create a new document in ERPNext.
 * @param {object} doc  must include a "doctype" field
 */
async function createDoc(doc) {
  const response = await erpClient.post(`/${doc.doctype}`, doc);
  return response.data.data;
}

module.exports = { erpClient, getList, getDoc, createDoc, buildFilters };
