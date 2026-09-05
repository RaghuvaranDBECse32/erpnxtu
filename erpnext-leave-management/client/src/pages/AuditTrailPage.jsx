import React, { useState, useEffect } from "react";
import {
  ScrollText,
  Search,
  RefreshCw,
  ShieldCheck,
  Calendar,
  Lock,
} from "lucide-react";
import Spinner from "../components/Spinner";
import { fetchAuditLogs } from "../api/client";
import { useApp } from "../context/AppContext";

export default function AuditTrailPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { showToast } = useApp();

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await fetchAuditLogs();
      if (res && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      showToast("Failed to fetch audit trail: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (log.payment_id && log.payment_id.toLowerCase().includes(q)) ||
      (log.event_type && log.event_type.toLowerCase().includes(q)) ||
      (log.action_taken && log.action_taken.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Immutable Audit Trail</h1>
          <p className="page-subtitle">
            Cryptographically timestamped audit log of all autonomous agent actions, interventions, and Razorpay webhook events.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={loadLogs} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Reload Logs</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50)",
              color: "var(--text-dim)",
            }}
          />
          <input
            type="text"
            className="search-input"
            placeholder="Search audit trail by Payment ID, action, event type or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: "36px" }}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-container" style={{ border: "none" }}>
          <table>
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>Payment ID</th>
                <th>Event Type</th>
                <th>Action Taken</th>
                <th>Details</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem" }}>
                    <Spinner size={24} color="var(--primary-400)" />
                    <div style={{ marginTop: "0.5rem", color: "var(--text-dim)" }}>
                      Verifying audit records...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text-dim)" }}>
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                filtered.map((log, idx) => (
                  <tr key={log.log_id || idx}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                      {log.log_id || `AUD-${idx + 1001}`}
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "Just now"}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--primary-400)" }}>
                      {log.payment_id}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background:
                            log.event_type?.includes("RECOVERED") || log.event_type?.includes("SUCCESS")
                              ? "rgba(16, 185, 129, 0.15)"
                              : log.event_type?.includes("FAILED")
                              ? "rgba(244, 63, 94, 0.15)"
                              : "rgba(99, 102, 241, 0.15)",
                          color:
                            log.event_type?.includes("RECOVERED") || log.event_type?.includes("SUCCESS")
                              ? "var(--emerald-400)"
                              : log.event_type?.includes("FAILED")
                              ? "var(--rose-400)"
                              : "var(--primary-400)",
                        }}
                      >
                        {log.event_type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                      {log.action_taken || "—"}
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: "340px" }}>
                      {log.details}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-dim)",
                          background: "rgba(255,255,255,0.04)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {log.performed_by || "AI_AGENT"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
