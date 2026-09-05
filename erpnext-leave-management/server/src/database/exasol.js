/**
 * exasol.js — Exasol Personal database connector for RecoverAI.
 *
 * Attempts a real Exasol WebSocket connection when credentials are configured.
 * Falls back to the in-memory seed store transparently when not configured.
 *
 * Exasol Personal: https://www.exasol.com/exasol-personal/
 * WebSocket port: 8563 (default)
 */

const env = require("../config/env");
const {
  generatePayments,
  getSummary,
  getFailureBreakdown,
  getRecoveryPerformance,
  getDailyRevenue,
} = require("../services/seedData");

let exasolConnected = false;
let wsql = null; // websql driver instance (only used when configured)

// ---------------------------------------------------------------------------
// Try to establish Exasol connection
// ---------------------------------------------------------------------------
async function initExasol() {
  if (!env.EXASOL_HOST || !env.EXASOL_PASSWORD) {
    console.log("[Exasol] No credentials configured — running in-memory fallback mode.");
    return false;
  }

  try {
    // Attempt to load the websql-exasol driver
    const Exasol = require("websql-exasol");
    wsql = new Exasol({
      host: env.EXASOL_HOST,
      port: env.EXASOL_PORT,
      user: env.EXASOL_USER,
      password: env.EXASOL_PASSWORD,
    });
    await wsql.connect();
    exasolConnected = true;
    console.log(`[Exasol] Connected to ${env.EXASOL_HOST}:${env.EXASOL_PORT}`);
    return true;
  } catch (err) {
    console.warn(`[Exasol] Connection failed (${err.message}). Using in-memory fallback.`);
    exasolConnected = false;
    return false;
  }
}

// ---------------------------------------------------------------------------
// Run a query — Exasol if connected, in-memory if not
// ---------------------------------------------------------------------------
async function query(sql, params = []) {
  if (exasolConnected && wsql) {
    try {
      const result = await wsql.query(sql, params);
      return result.rows || [];
    } catch (err) {
      console.warn("[Exasol] Query failed, falling back:", err.message);
    }
  }
  // In-memory fallback — return empty; callers use seed helpers instead
  return null;
}

// ---------------------------------------------------------------------------
// Public API — always works regardless of Exasol availability
// ---------------------------------------------------------------------------

function isConnected() {
  return exasolConnected;
}

function getMode() {
  return exasolConnected ? "exasol" : "memory";
}

async function getPayments(filters = {}) {
  if (exasolConnected) {
    let sql = `SELECT * FROM RECOVERAI.PAYMENTS ORDER BY CREATED_AT DESC`;
    const rows = await query(sql);
    if (rows) return rows;
  }
  let payments = generatePayments();
  if (filters.status) {
    payments = payments.filter(
      (p) => p.payment_status === filters.status.toUpperCase()
    );
  }
  if (filters.recovery_status) {
    payments = payments.filter(
      (p) => p.recovery_status === filters.recovery_status.toUpperCase()
    );
  }
  return payments;
}

async function getPaymentById(id) {
  if (exasolConnected) {
    const rows = await query(
      `SELECT * FROM RECOVERAI.PAYMENTS WHERE PAYMENT_ID = ?`,
      [id]
    );
    if (rows && rows.length) return rows[0];
  }
  return generatePayments().find((p) => p.payment_id === id) || null;
}

async function updatePayment(id, updates) {
  if (exasolConnected) {
    const setClauses = Object.keys(updates)
      .map((k) => `${k.toUpperCase()} = ?`)
      .join(", ");
    const values = [...Object.values(updates), id];
    await query(
      `UPDATE RECOVERAI.PAYMENTS SET ${setClauses} WHERE PAYMENT_ID = ?`,
      values
    );
    return true;
  }
  // In-memory update
  const payments = generatePayments();
  const p = payments.find((pay) => pay.payment_id === id);
  if (p) Object.assign(p, updates);
  return true;
}

async function insertAuditLog(log) {
  if (exasolConnected) {
    await query(
      `INSERT INTO RECOVERAI.AUDIT_LOGS (LOG_ID, PAYMENT_ID, EVENT, AGENT_ACTION, PROBABILITY, REASON, RESULT, AMOUNT_RECOVERED, CREATED_AT)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        log.log_id,
        log.payment_id,
        log.event,
        log.agent_action || null,
        log.probability || null,
        log.reason || null,
        log.result || null,
        log.amount_recovered || 0,
        log.created_at,
      ]
    );
    return;
  }
  _auditLogs.unshift(log);
}

async function getAuditLogs(paymentId) {
  if (exasolConnected) {
    const sql = paymentId
      ? `SELECT * FROM RECOVERAI.AUDIT_LOGS WHERE PAYMENT_ID = ? ORDER BY CREATED_AT DESC`
      : `SELECT * FROM RECOVERAI.AUDIT_LOGS ORDER BY CREATED_AT DESC`;
    const rows = await query(sql, paymentId ? [paymentId] : []);
    if (rows) return rows;
  }
  if (paymentId) {
    return _auditLogs.filter((l) => l.payment_id === paymentId);
  }
  return [..._auditLogs];
}

async function getAnalyticsSummary() {
  if (exasolConnected) {
    const rows = await query(`
      SELECT
        SUM(CASE WHEN PAYMENT_STATUS IN ('FAILED','ABANDONED') THEN AMOUNT ELSE 0 END) AS revenue_at_risk,
        SUM(CASE WHEN RECOVERY_STATUS = 'RECOVERED' THEN AMOUNT ELSE 0 END) AS recovered_revenue,
        COUNT(CASE WHEN PAYMENT_STATUS IN ('FAILED','ABANDONED') THEN 1 END) AS failed_payments,
        COUNT(CASE WHEN RECOVERY_STATUS = 'STOPPED' THEN 1 END) AS stopped_cases,
        COUNT(CASE WHEN RECOVERY_STATUS = 'PENDING' AND PAYMENT_STATUS IN ('FAILED','ABANDONED') THEN 1 END) AS active_cases
      FROM RECOVERAI.PAYMENTS
    `);
    if (rows && rows.length) {
      const r = rows[0];
      const rar = parseFloat(r.REVENUE_AT_RISK || 0);
      const rec = parseFloat(r.RECOVERED_REVENUE || 0);
      return {
        revenueAtRisk: rar,
        recoveredRevenue: rec,
        recoveryRate: rar > 0 ? parseFloat(((rec / (rar + rec)) * 100).toFixed(1)) : 0,
        failedPayments: parseInt(r.FAILED_PAYMENTS || 0),
        stoppedCases: parseInt(r.STOPPED_CASES || 0),
        activeRecoveryCases: parseInt(r.ACTIVE_CASES || 0),
      };
    }
  }
  return getSummary();
}

async function getFailureBreakdownDb() {
  if (exasolConnected) {
    const rows = await query(`
      SELECT FAILURE_REASON, SUM(AMOUNT) AS TOTAL_AMOUNT, COUNT(*) AS COUNT
      FROM RECOVERAI.PAYMENTS
      WHERE PAYMENT_STATUS IN ('FAILED','ABANDONED')
      GROUP BY FAILURE_REASON
      ORDER BY TOTAL_AMOUNT DESC
    `);
    if (rows && rows.length) {
      return rows.map((r) => ({
        reason: r.FAILURE_REASON,
        amount: parseFloat(r.TOTAL_AMOUNT),
        count: parseInt(r.COUNT),
      }));
    }
  }
  return getFailureBreakdown();
}

async function getDailyRevenueDb() {
  if (exasolConnected) {
    const rows = await query(`
      SELECT
        CAST(CREATED_AT AS DATE) AS DAY,
        SUM(CASE WHEN PAYMENT_STATUS IN ('FAILED','ABANDONED') THEN AMOUNT ELSE 0 END) AS AT_RISK,
        SUM(CASE WHEN RECOVERY_STATUS = 'RECOVERED' THEN AMOUNT ELSE 0 END) AS RECOVERED
      FROM RECOVERAI.PAYMENTS
      WHERE CREATED_AT >= ADD_DAYS(CURRENT_DATE, -14)
      GROUP BY CAST(CREATED_AT AS DATE)
      ORDER BY DAY
    `);
    if (rows && rows.length) return rows;
  }
  return getDailyRevenue();
}

// In-memory audit log store
const _auditLogs = [];

module.exports = {
  initExasol,
  isConnected,
  getMode,
  getPayments,
  getPaymentById,
  updatePayment,
  insertAuditLog,
  getAuditLogs,
  getAnalyticsSummary,
  getFailureBreakdownDb,
  getDailyRevenueDb,
  getRecoveryPerformance,
  query,
};
