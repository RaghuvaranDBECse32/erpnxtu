/**
 * exasol.js — Exasol Personal database connector for RecoverAI.
 *
 * Uses the official @exasol/exasol-driver-ts.
 * Falls back to the in-memory seed store transparently when not configured.
 */

const env = require("../config/env");
const { ExasolDriver } = require("@exasol/exasol-driver-ts");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const {
  generatePayments,
  getSummary,
  getFailureBreakdown,
  getRecoveryPerformance,
  getDailyRevenue,
} = require("../services/seedData");

let exasolConnected = false;
let driver = null;

// ---------------------------------------------------------------------------
// Try to establish Exasol connection
// ---------------------------------------------------------------------------
async function initExasol() {
  if (!env.EXASOL_HOST || !env.EXASOL_PASSWORD) {
    console.log("[Exasol] No credentials configured — running in-memory fallback mode.");
    return false;
  }

  try {
    // Exasol Personal (nano) uses a self-signed TLS certificate.
    // We must pass rejectUnauthorized: false to avoid CERT_UNKNOWN errors.
    const wsFactory = (url) => new WebSocket(url, { rejectUnauthorized: false });
    
    driver = new ExasolDriver(wsFactory, {
      host: env.EXASOL_HOST,
      port: parseInt(env.EXASOL_PORT || "8563", 10),
      user: env.EXASOL_USER,
      password: env.EXASOL_PASSWORD,
      autocommit: true,
      fetchSize: 128 * 1024,
      compression: false,
      clientName: "RecoverAI",
      clientVersion: "1.0.0"
    });
    
    await driver.connect();
    exasolConnected = true;
    console.log(`[Exasol] Connected to ${env.EXASOL_HOST}:${env.EXASOL_PORT}`);
    
    // Auto-initialize schema if needed
    await initializeSchema();
    
    return true;
  } catch (err) {
    const msg = err && (err.message || err.text || JSON.stringify(err));
    console.warn(`[Exasol] Connection failed (${msg}). Using in-memory fallback.`);
    console.warn("[Exasol] Full error:", err);
    exasolConnected = false;
    return false;
  }
}

async function initializeSchema() {
  try {
    // Use driver directly (exasolConnected guard doesn't matter here — driver is live)
    const exec = async (sql) => {
      try { await driver.execute(sql); } catch(e) { /* ignore already-exists errors */ }
    };

    // Create schema
    await exec(`CREATE SCHEMA RECOVERAI`);

    // Payments table
    await exec(`
      CREATE TABLE RECOVERAI.PAYMENTS (
        PAYMENT_ID VARCHAR(64),
        ORDER_ID VARCHAR(64),
        CUSTOMER_NAME VARCHAR(128),
        CUSTOMER_EMAIL VARCHAR(128),
        CUSTOMER_PHONE VARCHAR(32),
        AMOUNT DECIMAL(12,2),
        CURRENCY VARCHAR(8) DEFAULT 'INR',
        STATUS VARCHAR(32),
        FAILURE_REASON VARCHAR(256),
        FAILURE_CODE VARCHAR(64),
        PAYMENT_METHOD VARCHAR(32),
        ATTEMPT_COUNT INT DEFAULT 1,
        LAST_ATTEMPT_AT TIMESTAMP,
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (PAYMENT_ID)
      )
    `);

    // Audit log table
    await exec(`
      CREATE TABLE RECOVERAI.AUDIT_LOGS (
        LOG_ID VARCHAR(64),
        PAYMENT_ID VARCHAR(64),
        EVENT_TYPE VARCHAR(64),
        ACTION_TAKEN VARCHAR(64),
        DETAILS VARCHAR(2000),
        PERFORMED_BY VARCHAR(64) DEFAULT 'AI_AGENT',
        CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (LOG_ID)
      )
    `);

    // Seed if empty
    const countResult = await driver.query(`SELECT COUNT(*) AS CNT FROM RECOVERAI.PAYMENTS`);
    const cnt = countResult && countResult.data && countResult.data[0] ? Number(countResult.data[0][0]) : 0;
    
    if (cnt === 0) {
      console.log("[Exasol] Seeding initial data into Exasol...");
      const mockPayments = generatePayments();
      for (const p of mockPayments) {
        const insertSql = `INSERT INTO RECOVERAI.PAYMENTS 
          (PAYMENT_ID, ORDER_ID, CUSTOMER_NAME, CUSTOMER_EMAIL, CUSTOMER_PHONE, 
           AMOUNT, CURRENCY, STATUS, FAILURE_REASON, FAILURE_CODE, PAYMENT_METHOD, 
           ATTEMPT_COUNT, CREATED_AT, UPDATED_AT)
          VALUES (
            '${String(p.payment_id || "").replace(/'/g, "''")}',
            '${String(p.order_id || "").replace(/'/g, "''")}',
            '${String(p.customer_name || "").replace(/'/g, "''")}',
            '${String(p.customer_email || "").replace(/'/g, "''")}',
            '${String(p.customer_phone || "").replace(/'/g, "''")}',
            ${parseFloat(p.amount) || 0},
            '${String(p.currency || "INR").replace(/'/g, "''")}',
            '${String(p.payment_status || "FAILED").replace(/'/g, "''")}',
            '${String(p.failure_reason || "").replace(/'/g, "''")}',
            '${String(p.failure_code || "").replace(/'/g, "''")}',
            '${String(p.payment_method || "").replace(/'/g, "''")}',
            ${parseInt(p.attempt_count) || 1},
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )`;
        try { await driver.execute(insertSql); } catch(e) { /* skip dup */ }
      }
      console.log(`[Exasol] Seeded ${mockPayments.length} payments.`);
    }

    console.log("[Exasol] Schema ready.");
  } catch (e) {
    console.error("[Exasol] Failed to initialize schema:", e.text || e.message || e);
  }
}


// ---------------------------------------------------------------------------
// Run a query — Exasol if connected, in-memory if not
// ---------------------------------------------------------------------------
async function query(sql, params = []) {
  if (exasolConnected && driver) {
    try {
      // ExasolDriver expects parameter markers to be handled.
      // If we use parameters, we might need to map them or use string replacement.
      // But actually, ExasolDriver supports prepared statements but the API might vary.
      // Let's do simple parameter replacement for this mock hackathon
      let finalSql = sql;
      if (params.length > 0) {
        params.forEach(p => {
          let val = p;
          if (typeof val === 'string') val = `'${val.replace(/'/g, "''")}'`;
          else if (val === null) val = 'NULL';
          finalSql = finalSql.replace('?', val);
        });
      }
      
      const result = await driver.query(finalSql);
      
      // format result rows to simple objects
      if (result && result.columns && result.data) {
        return result.data.map((row) => {
          const obj = {};
          result.columns.forEach((col, idx) => {
            obj[col.name] = row[idx];
          });
          return obj;
        });
      }
      return [];
    } catch (err) {
      console.warn("[Exasol] Query failed, falling back:", err.message, "SQL:", sql);
    }
  }
  // In-memory fallback
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
    if (rows && rows.length > 0) return rows.map(mapPaymentDbRow);
  }
  let payments = generatePayments();
  if (filters.status) {
    payments = payments.filter((p) => p.payment_status === filters.status.toUpperCase());
  }
  if (filters.recovery_status) {
    payments = payments.filter((p) => p.recovery_status === filters.recovery_status.toUpperCase());
  }
  return payments;
}

function mapPaymentDbRow(r) {
  // mapping DB columns to expected JS properties
  return {
    payment_id: r.PAYMENT_ID,
    order_id: r.ORDER_ID,
    customer_name: r.CUSTOMER_NAME,
    customer_email: r.CUSTOMER_EMAIL,
    customer_phone: r.CUSTOMER_PHONE,
    amount: r.AMOUNT,
    currency: r.CURRENCY,
    payment_status: r.STATUS,
    failure_reason: r.FAILURE_REASON,
    failure_code: r.FAILURE_CODE,
    payment_method: r.PAYMENT_METHOD,
    attempt_count: r.ATTEMPT_COUNT,
    created_at: r.CREATED_AT
  };
}

async function getPaymentById(id) {
  if (exasolConnected) {
    const rows = await query(`SELECT * FROM RECOVERAI.PAYMENTS WHERE PAYMENT_ID = ?`, [id]);
    if (rows && rows.length) return mapPaymentDbRow(rows[0]);
  }
  return generatePayments().find((p) => p.payment_id === id) || null;
}

async function updatePayment(id, updates) {
  if (exasolConnected) {
    const setClauses = Object.keys(updates)
      .map((k) => `${k.toUpperCase()} = ?`)
      .join(", ");
    const values = [...Object.values(updates), id];
    await query(`UPDATE RECOVERAI.PAYMENTS SET ${setClauses} WHERE PAYMENT_ID = ?`, values);
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
      `INSERT INTO RECOVERAI.AUDIT_LOGS (LOG_ID, PAYMENT_ID, EVENT_TYPE, ACTION_TAKEN, DETAILS, PERFORMED_BY, CREATED_AT)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        log.log_id,
        log.payment_id,
        log.event || log.event_type,
        log.agent_action || log.action_taken || null,
        log.details || log.reason || null,
        log.performed_by || 'AI_AGENT'
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
    if (rows && rows.length > 0) return rows.map(r => ({
      log_id: r.LOG_ID,
      payment_id: r.PAYMENT_ID,
      event_type: r.EVENT_TYPE,
      action_taken: r.ACTION_TAKEN,
      details: r.DETAILS,
      performed_by: r.PERFORMED_BY,
      created_at: r.CREATED_AT
    }));
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
        SUM(CASE WHEN STATUS IN ('FAILED','ABANDONED') THEN AMOUNT ELSE 0 END) AS REVENUE_AT_RISK,
        SUM(CASE WHEN STATUS = 'RECOVERED' THEN AMOUNT ELSE 0 END) AS RECOVERED_REVENUE,
        COUNT(CASE WHEN STATUS IN ('FAILED','ABANDONED') THEN 1 END) AS FAILED_PAYMENTS
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
        stoppedCases: 0,
        activeRecoveryCases: 0,
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
      WHERE STATUS IN ('FAILED','ABANDONED')
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
        SUM(CASE WHEN STATUS IN ('FAILED','ABANDONED') THEN AMOUNT ELSE 0 END) AS AT_RISK,
        SUM(CASE WHEN STATUS = 'RECOVERED' THEN AMOUNT ELSE 0 END) AS RECOVERED
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

