/**
 * recoveryAgent.js — Deterministic AI Revenue Recovery Agent for RecoverAI.
 *
 * Analyzes failed payments and decides the optimal recovery action.
 * Optional: enriched reasoning via external LLM if AI_API_KEY is set.
 *
 * Bounded by stopping rules — never retries infinitely.
 */

const env = require("../config/env");

// ---------------------------------------------------------------------------
// Stopping rules — agent must respect these unconditionally
// ---------------------------------------------------------------------------
const STOP_RULES = [
  {
    id: "MAX_ATTEMPTS",
    check: (p) => p.attempt_count >= 3,
    reason: "Maximum retry attempts (3) reached. Further attempts unlikely to succeed.",
  },
  {
    id: "LOW_PROBABILITY",
    check: (p) => p.recovery_probability < 20,
    reason: "Recovery probability below 20% threshold. Not cost-effective to pursue.",
  },
  {
    id: "ALREADY_RECOVERED",
    check: (p) => p.recovery_status === "RECOVERED",
    reason: "Payment has already been successfully recovered.",
  },
  {
    id: "ALREADY_STOPPED",
    check: (p) => p.recovery_status === "STOPPED",
    reason: "Recovery was previously stopped. Case is closed.",
  },
  {
    id: "OPT_OUT",
    check: (p) => p.customer_opted_out === true,
    reason: "Customer has opted out of recovery communications.",
  },
];

// ---------------------------------------------------------------------------
// Recovery probability calculator
// ---------------------------------------------------------------------------
function calcProbability(payment) {
  const { failure_reason, amount, attempt_count, payment_method } = payment;

  const baseScores = {
    "Insufficient Funds": 72,
    "Bank Timeout": 82,
    "Card Declined": 55,
    "Expired Card": 68,
    "Checkout Abandoned": 40,
    "Duplicate Transaction": 88,
    "Network Error": 78,
    "UPI Timeout": 80,
    "3DS Authentication Failed": 60,
  };

  let prob = baseScores[failure_reason] || 50;

  // High-value boost
  if (amount > 5000) prob = Math.min(95, prob + 10);
  else if (amount < 500) prob = Math.max(10, prob - 10);

  // Attempt penalty
  if (attempt_count >= 2) prob = Math.max(10, prob - 20);
  if (attempt_count >= 3) prob = Math.max(5, prob - 30);

  // Method adjustments
  if (payment_method === "UPI") prob = Math.min(95, prob + 5);
  if (payment_method === "Wallet") prob = Math.min(95, prob + 8);

  return Math.round(prob);
}

// ---------------------------------------------------------------------------
// Action selector
// ---------------------------------------------------------------------------
function selectAction(payment, probability) {
  const { failure_reason, payment_method, attempt_count } = payment;

  if (probability < 20) return "STOP";

  // Temporary failures → retry
  if (
    ["Bank Timeout", "Network Error", "UPI Timeout", "Duplicate Transaction"].includes(failure_reason) &&
    attempt_count < 2
  ) {
    return "RETRY_PAYMENT";
  }

  // Insufficient funds → retry (may have been replenished)
  if (failure_reason === "Insufficient Funds" && attempt_count < 2) {
    return "RETRY_PAYMENT";
  }

  // Card issues → update payment method
  if (["Expired Card", "Card Declined"].includes(failure_reason)) {
    return attempt_count === 0 ? "SEND_RECOVERY_LINK" : "UPDATE_PAYMENT_METHOD";
  }

  // Auth failure → recovery link
  if (failure_reason === "3DS Authentication Failed") {
    return "SEND_RECOVERY_LINK";
  }

  // Abandoned → reminder first
  if (failure_reason === "Checkout Abandoned") {
    return attempt_count === 0 ? "SEND_REMINDER" : "SEND_RECOVERY_LINK";
  }

  // High value → escalate
  if (payment.amount > 8000 && probability > 50) {
    return "ESCALATE";
  }

  return "SEND_REMINDER";
}

// ---------------------------------------------------------------------------
// Reason generator
// ---------------------------------------------------------------------------
function generateReason(action, payment, probability) {
  const { failure_reason, amount, attempt_count } = payment;
  const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;

  const reasons = {
    RETRY_PAYMENT: `${failure_reason} is a temporary infrastructure/balance failure. With ${fmt(amount)} at stake and ${probability}% recovery probability, an immediate retry is the optimal first action.`,
    SEND_REMINDER: `Customer likely abandoned due to distraction. A targeted reminder email/SMS for ${fmt(amount)} has a ${probability}% chance of re-engaging them.`,
    SEND_RECOVERY_LINK: `${failure_reason} requires customer action. A recovery link allows them to complete payment via an alternative method. ${fmt(amount)} recoverable.`,
    UPDATE_PAYMENT_METHOD: `The payment method (${payment.payment_method}) appears blocked or expired. Prompting the customer to update their payment details offers the best recovery path for ${fmt(amount)}.`,
    ESCALATE: `High-value transaction of ${fmt(amount)} with ${probability}% recovery probability. Manual review and direct customer outreach recommended.`,
    STOP: `After ${attempt_count} attempts, probability has dropped to ${probability}%. Stopping recovery to avoid customer friction. Case closed.`,
  };

  return reasons[action] || "Analysis complete. Recovery action determined based on payment history.";
}

// ---------------------------------------------------------------------------
// Main agent function
// ---------------------------------------------------------------------------
async function analyzePayment(payment) {
  const steps = [];
  const timestamp = () => new Date().toISOString();

  steps.push({
    step: 1,
    label: "Payment Received",
    detail: `Analyzing ${payment.payment_id} — ${payment.customer_name} — ₹${payment.amount.toLocaleString("en-IN")}`,
    status: "done",
    time: timestamp(),
  });

  // Check stopping rules
  for (const rule of STOP_RULES) {
    if (rule.check(payment)) {
      steps.push({
        step: 2,
        label: "Stopping Rule Triggered",
        detail: rule.reason,
        status: "stopped",
        time: timestamp(),
      });
      return {
        shouldStop: true,
        stopRule: rule.id,
        action: "STOP",
        probability: payment.recovery_probability || 0,
        reason: rule.reason,
        steps,
      };
    }
  }

  steps.push({
    step: 2,
    label: "Stopping Rules Checked",
    detail: "No stopping conditions triggered. Proceeding with analysis.",
    status: "done",
    time: timestamp(),
  });

  // Calculate recovery probability
  const probability = calcProbability(payment);
  steps.push({
    step: 3,
    label: "Recovery Probability Calculated",
    detail: `Probability: ${probability}% — Failure: ${payment.failure_reason} — Attempts: ${payment.attempt_count}`,
    status: "done",
    time: timestamp(),
  });

  // Select action
  const action = selectAction(payment, probability);
  const reason = generateReason(action, payment, probability);

  steps.push({
    step: 4,
    label: "Recovery Action Selected",
    detail: `Action: ${action} — ${reason.substring(0, 100)}...`,
    status: "done",
    time: timestamp(),
  });

  // Optional LLM enrichment
  let enrichedReason = reason;
  if (env.AI_API_KEY && action !== "STOP") {
    try {
      enrichedReason = await enrichWithLLM(payment, action, probability, reason);
      steps.push({
        step: 5,
        label: "AI Reasoning Applied",
        detail: "LLM-enriched decision explanation generated.",
        status: "done",
        time: timestamp(),
      });
    } catch {
      steps.push({
        step: 5,
        label: "AI Reasoning Skipped",
        detail: "LLM unavailable — using deterministic reasoning.",
        status: "skipped",
        time: timestamp(),
      });
    }
  }

  return {
    shouldStop: action === "STOP",
    action,
    probability,
    reason: enrichedReason,
    steps,
  };
}

// ---------------------------------------------------------------------------
// Simulate execution of a recovery action
// ---------------------------------------------------------------------------
async function executeRecovery(payment, analysis) {
  const steps = [...analysis.steps];
  const timestamp = () => new Date().toISOString();

  steps.push({
    step: steps.length + 1,
    label: "Executing Recovery Action",
    detail: `Running: ${analysis.action}`,
    status: "running",
    time: timestamp(),
  });

  // Simulate async work
  await new Promise((r) => setTimeout(r, 300));

  // Outcome: success if probability > 50 and random factor aligns
  const rand = Math.random() * 100;
  const success = rand < analysis.probability;

  if (success) {
    steps.push({
      step: steps.length + 1,
      label: "Recovery Successful",
      detail: `₹${payment.amount.toLocaleString("en-IN")} recovered via ${analysis.action}.`,
      status: "success",
      time: timestamp(),
    });
    steps.push({
      step: steps.length + 1,
      label: "Audit Record Created",
      detail: "Recovery event logged to audit trail.",
      status: "done",
      time: timestamp(),
    });

    return {
      success: true,
      amountRecovered: payment.amount,
      newStatus: "RECOVERED",
      newRecoveryStatus: "RECOVERED",
      steps,
    };
  } else {
    const newAttempts = payment.attempt_count + 1;
    const shouldStop = newAttempts >= 3;

    steps.push({
      step: steps.length + 1,
      label: shouldStop ? "Recovery Stopped" : "Recovery Attempt Failed",
      detail: shouldStop
        ? `${newAttempts} attempts exhausted. Stopping case.`
        : `Attempt ${newAttempts} failed. Will retry on next trigger.`,
      status: shouldStop ? "stopped" : "failed",
      time: timestamp(),
    });

    return {
      success: false,
      amountRecovered: 0,
      newStatus: payment.payment_status,
      newRecoveryStatus: shouldStop ? "STOPPED" : "PENDING",
      newAttemptCount: newAttempts,
      steps,
    };
  }
}

// ---------------------------------------------------------------------------
// Optional LLM enrichment (only called when AI_API_KEY is set)
// ---------------------------------------------------------------------------
async function enrichWithLLM(payment, action, probability, baseReason) {
  // Placeholder — integrate with Gemini/OpenAI/etc. when key available
  return baseReason;
}

module.exports = { analyzePayment, executeRecovery, calcProbability };
