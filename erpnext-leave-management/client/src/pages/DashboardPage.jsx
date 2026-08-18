import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  PieChart as PieIcon,
  RefreshCw,
} from "lucide-react";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { getDashboard } from "../api/client";
import { useToast } from "../components/Toast";

export default function DashboardPage({ onOpenModal }) {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const res = await getDashboard();
      setData(res);
      if (showToast) addToast("Dashboard data refreshed", "info");
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch dashboard data", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 0" }}>
        <div style={{ display: "inline-block", width: "40px", height: "40px", border: "3px solid var(--border-medium)", borderTopColor: "var(--primary-500)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading ERPNext Dashboard Metrics...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const {
    totalEmployees = 0,
    totalApplications = 0,
    pendingApplications = 0,
    approvedApplications = 0,
    rejectedApplications = 0,
    recentApplications = [],
  } = data || {};

  // Compute approval rate
  const decidedCount = approvedApplications + rejectedApplications;
  const approvalRate = decidedCount > 0 ? Math.round((approvedApplications / decidedCount) * 100) : 100;

  return (
    <div>
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "800", letterSpacing: "-0.02em" }}>
            Leave Management Overview
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontSize: "0.95rem" }}>
            Real-time synchronization with ERPNext Frappe HR system
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => fetchDashboard(true)}
            className="btn btn-secondary"
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button onClick={onOpenModal} className="btn btn-primary">
            <PlusCircle size={16} />
            <span>New Leave Request</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard
          label="Active Employees"
          value={totalEmployees}
          icon={Users}
          gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
          iconBg="rgba(59, 130, 246, 0.15)"
          iconColor="#60a5fa"
          subtitle="Registered in ERPNext"
        />

        <StatCard
          label="Pending Review"
          value={pendingApplications}
          icon={Clock}
          gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
          iconBg="rgba(245, 158, 11, 0.15)"
          iconColor="#fbbf24"
          subtitle="Awaiting supervisor approval"
        />

        <StatCard
          label="Approved Requests"
          value={approvedApplications}
          icon={CheckCircle2}
          gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          iconBg="rgba(16, 185, 129, 0.15)"
          iconColor="#34d399"
          subtitle={`${approvalRate}% approval rate`}
        />

        <StatCard
          label="Rejected"
          value={rejectedApplications}
          icon={XCircle}
          gradient="linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)"
          iconBg="rgba(244, 63, 94, 0.15)"
          iconColor="#fb7185"
          subtitle="Denied by policy"
        />
      </div>

      {/* Main Grid: Recent Applications & Highlights */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
        {/* Recent Applications Table Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <FileSpreadsheet size={20} color="var(--primary-400)" />
                Recent Leave Applications
              </h2>
              <p className="card-subtitle">Latest records submitted by team members</p>
            </div>
            <Link to="/leaves" className="btn btn-outline" style={{ fontSize: "0.8rem", padding: "0.4rem 0.75rem" }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Days</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--text-dim)", padding: "2rem" }}>
                      No recent leave applications found.
                    </td>
                  </tr>
                ) : (
                  recentApplications.map((leave) => (
                    <tr key={leave.name}>
                      <td>
                        <div style={{ fontWeight: "600" }}>{leave.employee_name || leave.employee}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{leave.name}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: "500" }}>{leave.leave_type}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.8rem" }}>
                          {leave.from_date} <span style={{ color: "var(--text-dim)" }}>→</span> {leave.to_date}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: "700", color: "var(--primary-300)" }}>
                          {leave.total_leave_days}d
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={leave.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Summary & Leave Types Distribution */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Leave Policies Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: "1rem" }}>
                <PieIcon size={18} color="var(--primary-400)" />
                Standard Allowances
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[
                { type: "Privilege Leave (PL)", quota: "18 Days / Year", color: "#6366f1", desc: "Vacations, Planned" },
                { type: "Casual Leave (CL)", quota: "12 Days / Year", color: "#06b6d4", desc: "Short emergencies" },
                { type: "Sick Leave (SL)", quota: "10 Days / Year", color: "#10b981", desc: "Medical / Health" },
                { type: "Compensatory Off", quota: "Earned on Overtime", color: "#f59e0b", desc: "Weekend shifts" },
              ].map((policy) => (
                <div
                  key={policy.type}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: "600", fontSize: "0.85rem", color: policy.color }}>{policy.type}</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700" }}>{policy.quota}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{policy.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ERPNext Info Card */}
          <div
            className="card"
            style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <TrendingUp size={20} color="var(--primary-400)" />
              <h4 style={{ fontWeight: "700", fontSize: "0.95rem" }}>ERPNext Automated Sync</h4>
            </div>
            <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              All submitted requests are instantly forwarded to your Frappe backend DocType <code>Leave Application</code> and trigger internal workflow approvals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
