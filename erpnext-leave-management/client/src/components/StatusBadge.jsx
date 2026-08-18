import React from "react";

export default function StatusBadge({ status }) {
  const normalized = (status || "").toLowerCase();
  
  let badgeClass = "badge-pending";
  let label = status || "Pending";

  if (normalized === "approved") {
    badgeClass = "badge-approved";
  } else if (normalized === "rejected") {
    badgeClass = "badge-rejected";
  } else if (normalized === "open" || normalized === "pending") {
    badgeClass = "badge-pending";
    label = status === "Open" ? "Open (Pending)" : "Pending";
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}
