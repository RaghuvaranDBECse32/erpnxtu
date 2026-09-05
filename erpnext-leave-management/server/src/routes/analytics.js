/**
 * analytics.js — Analytics routes for RecoverAI.
 * GET  /api/analytics/summary        — KPI summary
 * GET  /api/analytics/failures       — failure breakdown
 * GET  /api/analytics/daily          — daily revenue metrics
 * GET  /api/analytics/performance    — recovery action performance
 * POST /api/analytics/query          — natural language → safe analytics query
 */

const express = require("express");
const router = express.Router();
const db = require("../database/exasol");

// Predefined safe NL query map
const NL_QUERIES = [
  {
    patterns: ["most revenue loss", "causing loss", "top failure", "revenue loss", "failure reason"],
    id: "failure_breakdown",
    label: "Top Failure Reasons by Revenue Loss",
    sql: "SELECT FAILURE_REASON, SUM(AMOUNT) as TOTAL_AMOUNT FROM RECOVERAI.PAYMENTS WHERE PAYMENT_STATUS IN ('FAILED','ABANDONED') GROUP BY FAILURE_REASON ORDER BY TOTAL_AMOUNT DESC",
    explanation: (data) =>
      `The biggest cause of revenue loss is "${data[0]?.reason}" at ₹${(data[0]?.amount || 0).toLocaleString("en-IN")}. ${data.length} distinct failure categories identified.`,
  },
  {
    patterns: ["recover today", "recovered today", "revenue today", "today"],
    id: "today_recovery",
    label: "Revenue Recovered Today",
    sql: "SELECT SUM(AMOUNT) AS RECOVERED FROM RECOVERAI.PAYMENTS WHERE RECOVERY_STATUS='RECOVERED' AND CAST(CREATED_AT AS DATE) = CURRENT_DATE",
    explanation: (data) =>
      `Today's recovered revenue: ₹${(data[0]?.amount || 0).toLocaleString("en-IN")}.`,
  },
  {
    patterns: ["top customer", "highest value", "recoverable customer", "which customer"],
    id: "top_customers",
    label: "Customers with Highest Recoverable Revenue",
    sql: "SELECT CUSTOMER_NAME, SUM(AMOUNT) AS TOTAL FROM RECOVERAI.PAYMENTS WHERE PAYMENT_STATUS IN ('FAILED','ABANDONED') AND RECOVERY_STATUS='PENDING' GROUP BY CUSTOMER_NAME ORDER BY TOTAL DESC LIMIT 5",
    explanation: (data) =>
      `Top recoverable customer: "${data[0]?.customer_name}" with ₹${(data[0]?.amount || 0).toLocaleString("en-IN")} at risk across their failed transactions.`,
  },
  {
    patterns: ["best action", "best recovery action", "which action works", "recovery action"],
    id: "action_performance",
    label: "Recovery Action Performance",
    sql: "SELECT AGENT_ACTION, COUNT(*) AS TOTAL, SUM(CASE WHEN RESULT='RECOVERED' THEN 1 ELSE 0 END) AS SUCCESSES FROM RECOVERAI.AUDIT_LOGS WHERE AGENT_ACTION IS NOT NULL GROUP BY AGENT_ACTION ORDER BY SUCCESSES DESC",
    explanation: (data) =>
      `The most effective recovery action is "${data[0]?.action || "RETRY_PAYMENT"}" based on historical success rates.`,
  },
  {
    patterns: ["payment method", "by method", "upi", "credit card", "debit card"],
    id: "by_method",
    label: "Revenue at Risk by Payment Method",
    sql: "SELECT PAYMENT_METHOD, SUM(AMOUNT) AS AT_RISK, COUNT(*) AS COUNT FROM RECOVERAI.PAYMENTS WHERE PAYMENT_STATUS IN ('FAILED','ABANDONED') GROUP BY PAYMENT_METHOD ORDER BY AT_RISK DESC",
    explanation: (data) =>
      `"${data[0]?.payment_method}" has the highest revenue at risk at ₹${(data[0]?.amount || 0).toLocaleString("en-IN")}.`,
  },
  {
    patterns: ["recovery rate", "success rate", "how many recovered", "how much recovered"],
    id: "recovery_rate",
    label: "Overall Recovery Rate",
    sql: "SELECT COUNT(*) AS TOTAL, SUM(CASE WHEN RECOVERY_STATUS='RECOVERED' THEN 1 ELSE 0 END) AS RECOVERED FROM RECOVERAI.PAYMENTS WHERE PAYMENT_STATUS IN ('FAILED','ABANDONED','RECOVERED')",
    explanation: (data) =>
      `Overall recovery rate based on payment records. Recovered: ${data[0]?.recovered || 0} of ${data[0]?.total || 0} eligible payments.`,
  },
];

function matchQuery(nl) {
  const lower = nl.toLowerCase();
  for (const q of NL_QUERIES) {
    if (q.patterns.some((p) => lower.includes(p))) return q;
  }
  return null;
}

// GET /api/analytics/summary
router.get("/summary", async (req, res) => {
  try {
    const summary = await db.getAnalyticsSummary();
    res.json({ success: true, data: summary, mode: db.getMode() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/failures
router.get("/failures", async (req, res) => {
  try {
    const data = await db.getFailureBreakdownDb();
    res.json({ success: true, data, mode: db.getMode() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/daily
router.get("/daily", async (req, res) => {
  try {
    const data = await db.getDailyRevenueDb();
    res.json({ success: true, data, mode: db.getMode() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/performance
router.get("/performance", async (req, res) => {
  try {
    const data = await db.getRecoveryPerformance();
    res.json({ success: true, data, mode: db.getMode() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/analytics/query — NL → analytics
router.post("/query", async (req, res) => {
  try {
    const question = req.body.question || req.body.query || req.body.prompt;
    if (!question) return res.status(400).json({ success: false, message: "question or query required" });

    const matched = matchQuery(question);
    if (!matched) {
      return res.json({
        success: true,
        matched: false,
        question,
        message: "Question not recognized. Try: 'What is causing the most revenue loss?' or 'Which customers have the highest recoverable revenue?'",
        suggestions: NL_QUERIES.map((q) => q.label),
      });
    }

    // Execute against DB (or fallback)
    let data = [];
    if (db.isConnected()) {
      const rows = await db.query(matched.sql);
      if (rows) {
        data = rows.map((r) => ({
          reason: r.FAILURE_REASON || r.CUSTOMER_NAME || r.PAYMENT_METHOD || r.AGENT_ACTION,
          amount: parseFloat(r.TOTAL_AMOUNT || r.RECOVERED || r.TOTAL || r.AT_RISK || 0),
          count: parseInt(r.COUNT || r.TOTAL || 0),
          payment_method: r.PAYMENT_METHOD,
          customer_name: r.CUSTOMER_NAME,
          action: r.AGENT_ACTION,
          successes: parseInt(r.SUCCESSES || 0),
        }));
      }
    }

    // Fallback to local data
    if (!data.length) {
      if (matched.id === "failure_breakdown") {
        data = await db.getFailureBreakdownDb();
      } else if (matched.id === "today_recovery") {
        const payments = await db.getPayments({ recovery_status: "RECOVERED" });
        const today = new Date().toDateString();
        const todayRec = payments.filter((p) => new Date(p.created_at).toDateString() === today);
        data = [{ amount: todayRec.reduce((s, p) => s + p.amount, 0) }];
      } else if (matched.id === "top_customers") {
        const payments = await db.getPayments();
        const map = {};
        payments
          .filter((p) => p.payment_status !== "SUCCESS" && p.recovery_status === "PENDING")
          .forEach((p) => {
            map[p.customer_name] = (map[p.customer_name] || 0) + p.amount;
          });
        data = Object.entries(map)
          .map(([customer_name, amount]) => ({ customer_name, amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
      } else if (matched.id === "by_method") {
        const payments = await db.getPayments();
        const map = {};
        payments
          .filter((p) => p.payment_status !== "SUCCESS")
          .forEach((p) => {
            map[p.payment_method] = (map[p.payment_method] || 0) + p.amount;
          });
        data = Object.entries(map)
          .map(([payment_method, amount]) => ({ payment_method, amount }))
          .sort((a, b) => b.amount - a.amount);
      } else if (matched.id === "action_performance") {
        data = db.getRecoveryPerformance();
      } else if (matched.id === "recovery_rate") {
        const summary = await db.getAnalyticsSummary();
        data = [{ total: summary.failedPayments, recovered: summary.activeRecoveryCases }];
      }
    }

    const explanation = matched.explanation(data);

    res.json({
      success: true,
      matched: true,
      question,
      query: {
        id: matched.id,
        label: matched.label,
        sql: matched.sql,
      },
      data,
      explanation,
      mode: db.getMode(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
