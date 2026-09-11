import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Bot,
  BarChart3,
  TrendingUp,
  ScrollText,
  Settings,
  Database,
  Radio,
  Zap,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Navbar({ mobileOpen, onCloseMobile }) {
  const { demoMode, dbMode } = useApp();

  return (
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-brand-container">
        <div className="sidebar-logo">
          {/* Simple AI/Orbit/Recovery icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="m4.93 4.93 2.83 2.83" />
            <path d="m16.24 16.24 2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">
            RecoverAI
          </span>
          <span className="sidebar-brand-tagline">
            AI REVENUE RECOVERY
          </span>
          <span style={{ fontSize: "0.55rem", color: "var(--primary-400)", fontWeight: 700, letterSpacing: "0.04em", marginTop: "1px", display: "block" }}>
            RAZORPAY · EXASOL · IQOO 2026
          </span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="sidebar-nav-section">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          onClick={onCloseMobile}
        >
          <LayoutDashboard size={16} />
          <span>Overview</span>
        </NavLink>

        <NavLink
          to="/payments"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          onClick={onCloseMobile}
        >
          <CreditCard size={16} />
          <span>Payments</span>
        </NavLink>

        <NavLink
          to="/recovery"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          onClick={onCloseMobile}
        >
          <Bot size={16} />
          <span>Recovery Agent</span>
          <span className="sidebar-badge">LIVE</span>
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          onClick={onCloseMobile}
        >
          <BarChart3 size={16} />
          <span>AI Analytics</span>
        </NavLink>

        <NavLink
          to="/revenue"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          onClick={onCloseMobile}
        >
          <TrendingUp size={16} />
          <span>Revenue</span>
        </NavLink>

        <NavLink
          to="/audit"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          onClick={onCloseMobile}
        >
          <ScrollText size={16} />
          <span>Audit Trail</span>
        </NavLink>

        {/* Separate Section: SYSTEM */}
        <div className="sidebar-section-heading">SYSTEM</div>

        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          onClick={onCloseMobile}
        >
          <Settings size={16} />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Bottom Status Box */}
      <div className="sidebar-footer">
        <div className="sidebar-status-card">
          <div
            className="sidebar-status-item sidebar-tooltip-trigger"
            data-tooltip="Demo Mode uses synthetic payment data. No real customer financial data is used."
          >
            <div className="sidebar-status-label">
              <span className="dot-status dot-amber" />
              <span style={{ fontWeight: 600, color: "#fff" }}>Demo Mode</span>
            </div>
            <span style={{ fontSize: "0.68rem", color: "var(--accent-amber-light)" }}>
              Synthetic
            </span>
          </div>

          <div
            style={{
              height: "1px",
              background: "var(--border-subtle)",
              margin: "2px 0",
            }}
          />

          <div className="sidebar-status-item">
            <div className="sidebar-status-label">
              <Database size={13} color="var(--text-dim)" />
              <span>Exasol Personal</span>
            </div>
            <div className="sidebar-status-indicator">
              <span className="dot-status dot-green" />
              <span style={{ color: "var(--accent-emerald-light)" }}>Connected</span>
            </div>
          </div>

          <div className="sidebar-status-item">
            <div className="sidebar-status-label">
              <Zap size={13} color="var(--text-dim)" />
              <span>Razorpay</span>
            </div>
            <div className="sidebar-status-indicator">
              <span className="dot-status dot-green" />
              <span style={{ color: "var(--accent-emerald-light)" }}>Connected</span>
            </div>
          </div>

          <div
            style={{
              height: "1px",
              background: "var(--border-subtle)",
              margin: "2px 0",
            }}
          />

          <div className="sidebar-status-item">
            <div className="sidebar-status-label">
              <Radio size={13} color="var(--text-dim)" />
              <span>iQOO 2026</span>
            </div>
            <div className="sidebar-status-indicator">
              <span className="dot-status dot-amber" />
              <span style={{ color: "var(--accent-amber-light)" }}>Mobile AI</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
