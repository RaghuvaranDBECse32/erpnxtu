import React from "react";

const STATUS_CONFIG = {
  FAILED: { label: "Failed", color: "badge-failed" },
  RECOVERED: { label: "Recovered", color: "badge-recovered" },
  SUCCESS: { label: "Success", color: "badge-success" },
  ABANDONED: { label: "Abandoned", color: "badge-abandoned" },
  IN_RECOVERY: { label: "In Recovery", color: "badge-in-recovery" },
  ANALYZING: { label: "Analyzing", color: "badge-analyzing" },
  OPEN: { label: "Open Case", color: "badge-open" },
  RESOLVED: { label: "Resolved", color: "badge-recovered" },
  STOPPED: { label: "Stopped", color: "badge-stopped" },
};

export default function StatusBadge({ status }) {
  const key = (status || "").toUpperCase();
  const conf = STATUS_CONFIG[key] || { label: status || "Unknown", color: "badge-default" };

  return (
    <span className={`badge ${conf.color}`}>
      <span className="badge-dot" />
      {conf.label}
    </span>
  );
}
