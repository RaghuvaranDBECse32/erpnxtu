/**
 * seedData.js — 75 synthetic Indian payment records for RecoverAI demo mode.
 * All data is entirely fictional. No real personal or financial data.
 */

const FAILURE_REASONS = [
  "Insufficient Funds",
  "Bank Timeout",
  "Card Declined",
  "Expired Card",
  "Checkout Abandoned",
  "Duplicate Transaction",
  "Network Error",
  "UPI Timeout",
  "3DS Authentication Failed",
];

const PAYMENT_METHODS = ["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet"];

const CUSTOMERS = [
  { id: "CUST-001", name: "Arun Kumar", email: "arun.kumar@example.com", phone: "9876543201" },
  { id: "CUST-002", name: "Priya Sharma", email: "priya.sharma@example.com", phone: "9876543202" },
  { id: "CUST-003", name: "Rahul Verma", email: "rahul.verma@example.com", phone: "9876543203" },
  { id: "CUST-004", name: "Meena Devi", email: "meena.devi@example.com", phone: "9876543204" },
  { id: "CUST-005", name: "Sanjay Kumar", email: "sanjay.kumar@example.com", phone: "9876543205" },
  { id: "CUST-006", name: "Anita Singh", email: "anita.singh@example.com", phone: "9876543206" },
  { id: "CUST-007", name: "Vikram Nair", email: "vikram.nair@example.com", phone: "9876543207" },
  { id: "CUST-008", name: "Sunita Patel", email: "sunita.patel@example.com", phone: "9876543208" },
  { id: "CUST-009", name: "Deepak Raj", email: "deepak.raj@example.com", phone: "9876543209" },
  { id: "CUST-010", name: "Kavitha Menon", email: "kavitha.menon@example.com", phone: "9876543210" },
  { id: "CUST-011", name: "Ramesh Yadav", email: "ramesh.yadav@example.com", phone: "9876543211" },
  { id: "CUST-012", name: "Lakshmi Iyer", email: "lakshmi.iyer@example.com", phone: "9876543212" },
  { id: "CUST-013", name: "Mohan Das", email: "mohan.das@example.com", phone: "9876543213" },
  { id: "CUST-014", name: "Rekha Gupta", email: "rekha.gupta@example.com", phone: "9876543214" },
  { id: "CUST-015", name: "Arjun Reddy", email: "arjun.reddy@example.com", phone: "9876543215" },
];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randAmount() {
  const tiers = [299, 499, 799, 999, 1299, 1499, 1999, 2499, 2999, 3499, 4999, 5999, 7999, 8499, 9999, 14999];
  return rand(tiers);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function calcProbability(failureReason, amount, attemptCount, method) {
  let base = 50;
  const reasons = {
    "Insufficient Funds": 72,
    "Bank Timeout": 82,
    "Card Declined": 55,
    "Expired Card": 68,
    "Checkout Abandoned": 40,
    "Duplicate Transaction": 85,
    "Network Error": 78,
    "UPI Timeout": 80,
    "3DS Authentication Failed": 60,
  };
  base = reasons[failureReason] || 50;
  if (amount > 5000) base = Math.min(95, base + 10);
  if (attemptCount >= 2) base = Math.max(10, base - 20);
  if (attemptCount >= 3) base = Math.max(5, base - 30);
  if (method === "UPI") base = Math.min(95, base + 5);
  return base;
}

let _payments = null;

function generatePayments() {
  if (_payments) return _payments;

  const payments = [];
  let counter = 10001;

  // 30 FAILED payments (at-risk, recoverable)
  for (let i = 0; i < 30; i++) {
    const cust = rand(CUSTOMERS);
    const reason = rand(FAILURE_REASONS);
    const method = rand(PAYMENT_METHODS);
    const amount = randAmount();
    const attempts = Math.floor(Math.random() * 2) + 1;
    const prob = calcProbability(reason, amount, attempts, method);
    payments.push({
      payment_id: `PAY-${counter++}`,
      customer_id: cust.id,
      customer_name: cust.name,
      customer_email: cust.email,
      amount,
      currency: "INR",
      payment_status: "FAILED",
      failure_reason: reason,
      payment_method: method,
      created_at: daysAgo(Math.floor(Math.random() * 30)),
      attempt_count: attempts,
      recovery_probability: prob,
      recovery_status: "PENDING",
      razorpay_order_id: null,
      razorpay_payment_id: null,
    });
  }

  // 17 ABANDONED payments
  for (let i = 0; i < 17; i++) {
    const cust = rand(CUSTOMERS);
    const amount = randAmount();
    payments.push({
      payment_id: `PAY-${counter++}`,
      customer_id: cust.id,
      customer_name: cust.name,
      customer_email: cust.email,
      amount,
      currency: "INR",
      payment_status: "ABANDONED",
      failure_reason: "Checkout Abandoned",
      payment_method: rand(PAYMENT_METHODS),
      created_at: daysAgo(Math.floor(Math.random() * 15)),
      attempt_count: 1,
      recovery_probability: calcProbability("Checkout Abandoned", amount, 1, "UPI"),
      recovery_status: "PENDING",
      razorpay_order_id: null,
      razorpay_payment_id: null,
    });
  }

  // 15 RECOVERED payments
  for (let i = 0; i < 15; i++) {
    const cust = rand(CUSTOMERS);
    const amount = randAmount();
    const reason = rand(["Insufficient Funds", "Bank Timeout", "Network Error", "UPI Timeout"]);
    payments.push({
      payment_id: `PAY-${counter++}`,
      customer_id: cust.id,
      customer_name: cust.name,
      customer_email: cust.email,
      amount,
      currency: "INR",
      payment_status: "RECOVERED",
      failure_reason: reason,
      payment_method: rand(PAYMENT_METHODS),
      created_at: daysAgo(Math.floor(Math.random() * 30) + 5),
      attempt_count: 2,
      recovery_probability: 75,
      recovery_status: "RECOVERED",
      razorpay_order_id: `order_demo${Math.random().toString(36).substring(2, 10)}`,
      razorpay_payment_id: `pay_demo${Math.random().toString(36).substring(2, 10)}`,
    });
  }

  // 5 STOPPED (agent gave up)
  for (let i = 0; i < 5; i++) {
    const cust = rand(CUSTOMERS);
    const amount = randAmount();
    payments.push({
      payment_id: `PAY-${counter++}`,
      customer_id: cust.id,
      customer_name: cust.name,
      customer_email: cust.email,
      amount,
      currency: "INR",
      payment_status: "FAILED",
      failure_reason: "Card Declined",
      payment_method: "Credit Card",
      created_at: daysAgo(Math.floor(Math.random() * 20) + 10),
      attempt_count: 3,
      recovery_probability: 12,
      recovery_status: "STOPPED",
      razorpay_order_id: null,
      razorpay_payment_id: null,
    });
  }

  // 8 SUCCESS (completed normally)
  for (let i = 0; i < 8; i++) {
    const cust = rand(CUSTOMERS);
    const amount = randAmount();
    payments.push({
      payment_id: `PAY-${counter++}`,
      customer_id: cust.id,
      customer_name: cust.name,
      customer_email: cust.email,
      amount,
      currency: "INR",
      payment_status: "SUCCESS",
      failure_reason: null,
      payment_method: rand(PAYMENT_METHODS),
      created_at: daysAgo(Math.floor(Math.random() * 30)),
      attempt_count: 1,
      recovery_probability: 100,
      recovery_status: "NOT_REQUIRED",
      razorpay_order_id: `order_demo${Math.random().toString(36).substring(2, 10)}`,
      razorpay_payment_id: `pay_demo${Math.random().toString(36).substring(2, 10)}`,
    });
  }

  // Sort newest first
  payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  _payments = payments;
  return payments;
}

function getSummary() {
  const payments = generatePayments();
  const failed = payments.filter((p) => p.payment_status === "FAILED" || p.payment_status === "ABANDONED");
  const recovered = payments.filter((p) => p.recovery_status === "RECOVERED");
  const stopped = payments.filter((p) => p.recovery_status === "STOPPED");
  const active = payments.filter((p) =>
    (p.payment_status === "FAILED" || p.payment_status === "ABANDONED") &&
    p.recovery_status === "PENDING"
  );

  const revenueAtRisk = failed.reduce((s, p) => s + p.amount, 0);
  const recoveredRevenue = recovered.reduce((s, p) => s + p.amount, 0);
  const recoveryRate = revenueAtRisk > 0
    ? ((recoveredRevenue / (revenueAtRisk + recoveredRevenue)) * 100).toFixed(1)
    : "0.0";

  return {
    revenueAtRisk,
    recoveredRevenue,
    recoveryRate: parseFloat(recoveryRate),
    failedPayments: failed.length,
    activeRecoveryCases: active.length,
    stoppedCases: stopped.length,
    totalPayments: payments.length,
    successPayments: payments.filter((p) => p.payment_status === "SUCCESS").length,
  };
}

function getFailureBreakdown() {
  const payments = generatePayments();
  const failed = payments.filter((p) =>
    p.payment_status === "FAILED" || p.payment_status === "ABANDONED"
  );
  const map = {};
  for (const p of failed) {
    map[p.failure_reason] = (map[p.failure_reason] || 0) + p.amount;
  }
  return Object.entries(map)
    .map(([reason, amount]) => ({ reason, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function getRecoveryPerformance() {
  const payments = generatePayments();
  const actions = ["RETRY_PAYMENT", "SEND_REMINDER", "SEND_RECOVERY_LINK", "UPDATE_PAYMENT_METHOD"];
  return actions.map((action) => ({
    action,
    success: Math.floor(Math.random() * 8) + 2,
    total: Math.floor(Math.random() * 6) + 8,
  }));
}

function getDailyRevenue() {
  const days = 14;
  const result = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    result.push({
      date: label,
      atRisk: Math.floor(Math.random() * 15000) + 3000,
      recovered: Math.floor(Math.random() * 8000) + 1000,
    });
  }
  return result;
}

module.exports = { generatePayments, getSummary, getFailureBreakdown, getRecoveryPerformance, getDailyRevenue };
