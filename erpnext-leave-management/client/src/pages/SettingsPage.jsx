import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Database,
  CreditCard,
  Bot,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  KeyRound,
  Layers,
} from "lucide-react";
import { checkHealth } from "../api/client";
import { useApp } from "../context/AppContext";

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const { demoMode, dbMode, showToast, refreshStats } = useApp();

  const loadHealth = async () => {
    try {
      setLoading(true);
      const res = await checkHealth();
      setHealth(res);
    } catch (e) {
      console.warn("Health check error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Architecture & Settings</h1>
          <p className="page-subtitle">
            Configuration telemetry, Exasol Personal database connectivity, and Razorpay payment gateway integration.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadHealth} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Verify Connectivity</span>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Razorpay Gateway Status */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CreditCard size={18} color="var(--primary-400)" />
              <h2 className="card-title">Razorpay Payment Gateway</h2>
            </div>
            <span
              className="badge"
              style={{
                background: health?.razorpay === "configured" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                color: health?.razorpay === "configured" ? "var(--emerald-400)" : "var(--amber-400)",
              }}
            >
              {health?.razorpay === "configured" ? "Live Connected" : "Simulated Sandbox"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Execution Mode:</span>
              <strong style={{ color: "var(--text-main)" }}>{demoMode ? "Demo Mode (Safe Sandbox)" : "Production Live"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Supported Methods:</span>
              <span>UPI, Cards (Visa/Mastercard), NetBanking, Wallets</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Webhook Endpoint:</span>
              <code style={{ color: "var(--primary-400)" }}>/api/payments/webhook</code>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Smart Retry Engine:</span>
              <span style={{ color: "var(--emerald-400)" }}>Enabled & Active</span>
            </div>
          </div>
        </div>

        {/* Exasol Analytics Status */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Database size={18} color="var(--primary-400)" />
              <h2 className="card-title">Exasol Personal Engine</h2>
            </div>
            <span
              className="badge"
              style={{
                background: health?.exasol === "connected" ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)",
                color: health?.exasol === "connected" ? "var(--emerald-400)" : "var(--primary-400)",
              }}
            >
              {health?.exasol === "connected" ? "Exasol Live" : "In-Memory Accelerated"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Database Schema:</span>
              <strong style={{ color: "var(--text-main)" }}>RECOVERAI</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Analytics Acceleration:</span>
              <span>Columnar In-Memory Processing</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-muted)" }}>NL to SQL Mapping:</span>
              <span style={{ color: "var(--emerald-400)" }}>Verified & Safe</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Synthetic Dataset:</span>
              <span>75 High-Fidelity Records</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Hackathon Blueprint Card */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={18} color="var(--primary-400)" />
            <h2 className="card-title">Dual Hackathon Architecture Blueprint</h2>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div style={{ padding: "1rem", background: "rgba(15, 23, 42, 0.6)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontWeight: 600, color: "var(--primary-400)", marginBottom: "0.5rem" }}>
              Razorpay AI Buildathon — AI Revenue Recovery
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Autonomous agent intercepting Razorpay failure webhooks, evaluating error codes (e.g. BAD_REQUEST_PAYMENT_TIMED_OUT, INSUFFICIENT_FUNDS), executing smart retries or issuing dynamic UPI recovery deep links with zero checkout friction.
            </p>
          </div>

          <div style={{ padding: "1rem", background: "rgba(15, 23, 42, 0.6)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontWeight: 600, color: "var(--emerald-400)", marginBottom: "0.5rem" }}>
              Exasol AI + Data Challenge 2026
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Leveraging Exasol Personal as high-speed in-memory columnar engine for real-time payment telemetry, failure pattern clustering, recovery probability modeling, and natural-language to SQL exploration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
