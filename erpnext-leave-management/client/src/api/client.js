import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const errorMsg =
      err.response?.data?.message || err.message || "Network request failed";
    return Promise.reject(new Error(errorMsg));
  }
);

// Health
export const checkHealth = () => api.get("/api/health");

// Payments
export const fetchPayments = (params = {}) => api.get("/api/payments", { params });
export const fetchPaymentById = (id) => api.get(`/api/payments/${id}`);
export const createPaymentOrder = (payload) => api.post("/api/payments/create-order", payload);
export const verifyPayment = (payload) => api.post("/api/payments/verify", payload);

// Recovery Agent
export const analyzePayment = (id) => api.post(`/api/recovery/analyze/${id}`);
export const executeRecovery = (id, payload = {}) =>
  api.post(`/api/recovery/execute/${id}`, payload);
export const fetchRecoveryCases = () => api.get("/api/recovery/cases");

// Analytics
export const fetchSummary = () => api.get("/api/analytics/summary");
export const fetchFailures = () => api.get("/api/analytics/failures");
export const fetchDailyMetrics = () => api.get("/api/analytics/daily");
export const executeAnalyticsQuery = (query, mode = "auto") =>
  api.post("/api/analytics/query", { query, mode });

// Audit
export const fetchAuditLogs = (payId = null) =>
  payId ? api.get(`/api/audit/${payId}`) : api.get("/api/audit");

export default api;
