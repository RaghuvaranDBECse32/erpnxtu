import React, { useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function TopHeader({ onToggleMobileMenu }) {
  const { demoMode } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = [
    {
      id: 1,
      type: "success",
      title: "Smart Retry Successful",
      desc: "₹2,499 recovered for Meena Devi (PAY-10482)",
      time: "2m ago",
    },
    {
      id: 2,
      type: "warning",
      title: "Circuit Breaker Tripped",
      desc: "3 consecutive failures detected on HDFC UPI node",
      time: "14m ago",
    },
    {
      id: 3,
      type: "info",
      title: "Exasol Sync Completed",
      desc: "75 telemetry records indexed in columnar cache (0.4ms)",
      time: "1h ago",
    },
    {
      id: 4,
      type: "info",
      title: "iQOO Mobile AI Signal",
      desc: "High mobile payment failure rate detected — 68% failures on Android UPI clients",
      time: "3h ago",
    },
  ];

  return (
    <header className="top-header">
      <div className="top-header-left">
        <button
          className="mobile-menu-toggle"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="top-header-title-wrap">
          <div className="top-header-title">
            Revenue Recovery Command Center
          </div>
          <div className="top-header-subtitle">
            Autonomous AI agent · Razorpay Payments · Exasol Analytics · iQOO Mobile Intelligence
          </div>
        </div>
      </div>

      <div className="top-header-right">
        {/* Quick Search */}
        <button
          className="header-search-btn"
          onClick={() => {
            const searchInput = document.querySelector(".page-search-input");
            if (searchInput) searchInput.focus();
          }}
          title="Search transactions or AI telemetry"
        >
          <Search size={14} />
          <span>Search telemetry...</span>
          <kbd className="header-search-kbd">⌘K</kbd>
        </button>

        {/* Environment Selector */}
        <div className="env-selector-badge" title="Demo Mode active with synthetic Indian banking telemetry">
          <span className="dot-status dot-amber" />
          <span>DEMO</span>
        </div>

        {/* Notifications Popover */}
        <div style={{ position: "relative" }}>
          <button
            className="header-icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            title="System notifications"
          >
            <Bell size={16} />
            <span className="header-notification-badge" />
          </button>

          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: "120%",
                right: 0,
                width: "320px",
                background: "var(--bg-surface-card)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-modal)",
                padding: "0.85rem",
                zIndex: 60,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.65rem",
                  paddingBottom: "0.5rem",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ fontWeight: 700, fontSize: "0.78rem" }}>
                  Autonomous Agent Alerts
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--brand-primary-light)",
                    cursor: "pointer",
                  }}
                  onClick={() => setShowNotifications(false)}
                >
                  Close
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      padding: "0.5rem",
                      background: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {n.type === "success" ? (
                      <CheckCircle2 size={14} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: "2px" }} />
                    ) : n.type === "warning" ? (
                      <AlertTriangle size={14} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: "2px" }} />
                    ) : (
                      <Sparkles size={14} color="var(--brand-primary-light)" style={{ flexShrink: 0, marginTop: "2px" }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.74rem", fontWeight: 600, color: "#fff" }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "1px" }}>
                        {n.desc}
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", marginTop: "2px" }}>
                        {n.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User / Avatar Menu */}
        <div style={{ position: "relative" }}>
          <div
            className="header-user-avatar"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="avatar-circle">
              RA
            </div>
            <span className="avatar-label">Fintech Ops</span>
            <ChevronDown size={13} color="var(--text-dim)" />
          </div>

          {showUserMenu && (
            <div
              style={{
                position: "absolute",
                top: "120%",
                right: 0,
                width: "200px",
                background: "var(--bg-surface-card)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-modal)",
                padding: "0.5rem",
                zIndex: 60,
              }}
            >
              <div
                style={{
                  padding: "0.4rem 0.6rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  marginBottom: "0.3rem",
                }}
              >
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff" }}>
                  Autonomous RecoverAI
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>
                  ops@recoverai.internal
                </div>
              </div>

              <div
                style={{
                  padding: "0.35rem 0.6rem",
                  fontSize: "0.74rem",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  borderRadius: "var(--radius-xs)",
                }}
                onClick={() => setShowUserMenu(false)}
              >
                Agent Rules & Policies
              </div>
              <div
                style={{
                  padding: "0.35rem 0.6rem",
                  fontSize: "0.74rem",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  borderRadius: "var(--radius-xs)",
                }}
                onClick={() => setShowUserMenu(false)}
              >
                Exasol Cache Diagnostics
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
