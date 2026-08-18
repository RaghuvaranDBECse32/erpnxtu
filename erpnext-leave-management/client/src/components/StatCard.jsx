import React from "react";

export default function StatCard({ label, value, icon: Icon, gradient, iconBg, iconColor, subtitle }) {
  return (
    <div
      className="stat-card"
      style={{
        "--stat-gradient": gradient || "var(--grad-primary)",
        "--stat-icon-bg": iconBg || "rgba(99, 102, 241, 0.15)",
        "--stat-icon-color": iconColor || "var(--primary-400)",
      }}
    >
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {subtitle && <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>{subtitle}</div>}
      </div>
      {Icon && (
        <div className="stat-icon">
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}
