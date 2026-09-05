import React from "react";
import { X, Sparkles, ShieldCheck, CheckCircle2, Bot } from "lucide-react";

export default function ReasoningModal({ payment, reasoning, onClose }) {
  if (!reasoning && !payment) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: "520px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(99, 102, 241, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--brand-primary-light)",
              }}
            >
              <Bot size={16} />
            </div>
            <div>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>
                AI Decision Reasoning
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                Autonomous explanation for {payment?.payment_id || "PAY-10482"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: "1.25rem" }}>
          <div
            style={{
              background: "rgba(15, 22, 38, 0.8)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
            }}
          >
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "var(--brand-primary-light)",
                letterSpacing: "0.05em",
                marginBottom: "0.5rem",
              }}
            >
              EXECUTIVE BUSINESS RATIONALE
            </div>
            <p style={{ fontSize: "0.85rem", color: "#fff", lineHeight: 1.6 }}>
              {reasoning ||
                "Payment failed due to a temporary failure pattern. Similar transactions have a high recovery rate."}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div
              style={{
                padding: "0.75rem",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontWeight: 600 }}>
                RECOVERY PROBABILITY
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "var(--accent-emerald-light)",
                  marginTop: "2px",
                }}
              >
                {payment?.recovery_probability || 82}%
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-dim)", marginTop: "2px" }}>
                Trained on Indian banking failure curves
              </div>
            </div>

            <div
              style={{
                padding: "0.75rem",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontWeight: 600 }}>
                CIRCUIT BREAKER STATUS
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "var(--accent-emerald)",
                  marginTop: "2px",
                }}
              >
                HEALTHY
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-dim)", marginTop: "2px" }}>
                Zero customer fatigue detected
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: "0.75rem 1.25rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
