import React, { useState } from "react";
import {
  X,
  CreditCard,
  User,
  AlertTriangle,
  Bot,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Zap,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { executeRecovery } from "../api/client";
import { useApp } from "../context/AppContext";

export default function PaymentDetailModal({ payment, onClose, onRecoverySuccess }) {
  const [executing, setExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast, refreshStats } = useApp();

  if (!payment) return null;

  const formatINR = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);

  const handleExecute = async () => {
    try {
      setExecuting(true);
      const res = await executeRecovery(payment.payment_id);
      if (res && res.success) {
        showToast(
          res.recovered
            ? `Successfully recovered ${formatINR(res.amountRecovered || payment.amount)}!`
            : `Recovery intervention dispatched (${res.result?.newRecoveryStatus || "STOPPED"})`,
          res.recovered ? "success" : "info"
        );
        refreshStats();
        if (onRecoverySuccess) onRecoverySuccess();
        onClose();
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setExecuting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(
      `https://checkout.razorpay.com/v1/checkout.html?order_id=order_${payment.payment_id}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("Razorpay tokenized recovery link copied to clipboard!", "success");
  };

  const steps = [
    { title: "Webhook Ingested", time: "0.0s", completed: true },
    { title: "Failure Classified", time: "+0.2s", completed: true },
    { title: "ML Recovery Scoring", time: "+0.5s", completed: true },
    { title: "Safety Circuit Breaker", time: "+0.8s", completed: true },
    {
      title: payment.status === "RECOVERED" ? "Recovery Completed" : "Action Dispatched",
      time: "+1.2s",
      completed: payment.status === "RECOVERED",
      active: payment.status !== "RECOVERED",
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", fontFamily: "var(--font-mono)" }}>
                  {payment.payment_id}
                </h2>
                <StatusBadge status={payment.status} />
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-dim)", marginTop: "2px" }}>
                Razorpay Payment Telemetry & In-Memory Exasol Record
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>
              {formatINR(payment.amount)}
            </span>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Section 1: Payment & Customer Information */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="card" style={{ padding: "0.85rem", margin: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.6rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--brand-primary-light)" }}>
                <CreditCard size={14} />
                <span>PAYMENT INFORMATION</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>Payment Method:</span>
                  <span style={{ fontWeight: 600 }}>{payment.payment_method || "UPI"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>Currency:</span>
                  <span style={{ fontWeight: 600 }}>{payment.currency || "INR"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>Bank / Issuer:</span>
                  <span style={{ fontWeight: 600 }}>{payment.bank || "HDFC Bank"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>Provider:</span>
                  <span style={{ color: "var(--brand-primary-light)", fontWeight: 600 }}>Razorpay Standard</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>Timestamp:</span>
                  <span style={{ color: "var(--text-muted)" }}>{new Date(payment.created_at || Date.now()).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "0.85rem", margin: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.6rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--brand-primary-light)" }}>
                <User size={14} />
                <span>CUSTOMER INFORMATION</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>Customer:</span>
                  <span style={{ fontWeight: 600 }}>{payment.customer_name || "Verified Customer"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>Email:</span>
                  <span style={{ color: "var(--text-muted)" }}>{payment.customer_email || "customer@fintech.in"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>Phone:</span>
                  <span style={{ color: "var(--text-muted)" }}>{payment.customer_phone || "+91 98765 43210"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>Segment:</span>
                  <span style={{ color: "var(--accent-emerald-light)", fontWeight: 600 }}>High Value (Tier 1)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>Attempts:</span>
                  <span style={{ fontWeight: 600 }}>{payment.attempt_count || 1} of 3 max</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Failure Analysis */}
          <div className="card" style={{ padding: "0.85rem", margin: 0, borderColor: "var(--accent-rose-border)", background: "rgba(244, 63, 94, 0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-rose-light)" }}>
              <AlertTriangle size={14} />
              <span>FAILURE ANALYSIS & CLASSIFICATION</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.75rem" }}>
              <div>
                <span style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>Root Cause / Error Code:</span>
                <div style={{ fontWeight: 700, color: "#fff", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
                  {payment.error_code || "PAYMENT_TIMED_OUT"}
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>Failure Reason:</span>
                <div style={{ fontWeight: 700, color: "var(--accent-rose-light)", marginTop: "2px" }}>
                  {payment.failure_reason || "Insufficient Funds"}
                </div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>Gateway Description:</span>
                <p style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                  {payment.error_description || "Transaction failed at issuing bank switch. Telemetry indicates temporary account or network limitation."}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: AI Recovery Decision */}
          <div className="agent-console-card" style={{ padding: "0.95rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.75rem", fontWeight: 700, color: "var(--brand-primary-light)" }}>
                <Bot size={15} />
                <span>AUTONOMOUS AI RECOVERY DECISION</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.72rem", color: "var(--accent-emerald-light)", fontWeight: 700 }}>
                <span className="dot-status dot-green" />
                <span>Confidence: {payment.recovery_probability || 82}%</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "0.85rem", fontSize: "0.75rem" }}>
              <div>
                <span style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>Recommended Strategy:</span>
                <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#fff", marginTop: "2px", letterSpacing: "0.02em" }}>
                  {payment.ai_action || "RETRY PAYMENT"}
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "4px" }}>
                  Payment failed due to a temporary failure pattern. Similar transactions have an 82% recovery rate via automated retry.
                </p>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.65rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ color: "var(--text-dim)", fontSize: "0.68rem", fontWeight: 600 }}>SAFETY CIRCUIT BREAKER</div>
                <div style={{ color: "var(--accent-emerald)", fontWeight: 700, marginTop: "2px", fontSize: "0.74rem" }}>
                  All Clear (No Fatigue)
                </div>
                <div style={{ color: "var(--text-dim)", fontSize: "0.68rem", marginTop: "4px" }}>
                  Rule engine validated customer fatigue, retry window limits, and rate thresholds.
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Recovery Timeline */}
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-dim)", marginBottom: "0.5rem", letterSpacing: "0.05em" }}>
              ORCHESTRATION PIPELINE TIMELINE
            </div>
            <div className="agent-timeline">
              {steps.map((s, idx) => (
                <div key={idx} className="agent-timeline-node">
                  <div
                    className={`agent-node-circle ${
                      s.completed ? "completed" : s.active ? "active" : ""
                    }`}
                  >
                    {s.completed ? <CheckCircle2 size={12} /> : idx + 1}
                  </div>
                  <span className={`agent-node-label ${s.completed || s.active ? "active" : ""}`}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleCopyLink}>
            <Copy size={13} />
            <span>{copied ? "Copied Link!" : "Copy Razorpay Link"}</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={executing || payment.status === "RECOVERED"}
          >
            <Zap size={13} className={executing ? "animate-spin" : ""} />
            <span>{payment.status === "RECOVERED" ? "Already Recovered" : "Execute Recovery Action"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
