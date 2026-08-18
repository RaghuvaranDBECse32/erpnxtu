import React, { useState, useEffect, useMemo } from "react";
import {
  ListOrdered,
  Search,
  Filter,
  PlusCircle,
  Calendar,
  User,
  FileText,
  Clock,
  RefreshCw,
} from "lucide-react";
import StatusBadge from "../components/StatusBadge";
import { getLeaves } from "../api/client";
import { useToast } from "../components/Toast";

export default function LeavesPage({ onOpenModal }) {
  const { addToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const fetchLeaves = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const data = await getLeaves();
      setLeaves(data || []);
      if (showToast) addToast("Leave applications updated", "info");
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch leave applications", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((item) => {
      const matchSearch =
        (item.employee_name && item.employee_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.employee && item.employee.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchStatus = true;
      if (statusFilter !== "ALL") {
        if (statusFilter === "PENDING") {
          matchStatus = item.status === "Open" || item.status === "Pending";
        } else {
          matchStatus = item.status === statusFilter;
        }
      }

      let matchType = true;
      if (typeFilter !== "ALL") {
        matchType = item.leave_type === typeFilter;
      }

      return matchSearch && matchStatus && matchType;
    });
  }, [leaves, searchQuery, statusFilter, typeFilter]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(leaves.map((l) => l.leave_type).filter(Boolean));
    return Array.from(types);
  }, [leaves]);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "800", letterSpacing: "-0.02em" }}>
            Leave Applications
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontSize: "0.95rem" }}>
            Manage, filter, and track all submitted employee leave applications
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => fetchLeaves(true)} className="btn btn-secondary" disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button onClick={onOpenModal} className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Apply Leave</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="card" style={{ marginBottom: "1.5rem", padding: "1.25rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          {/* Search Input */}
          <div style={{ position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-dim)",
              }}
            />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: "2.75rem" }}
              placeholder="Search by employee name, ID, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending / Open</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Leave Type Filter */}
          <div>
            <select
              className="form-control"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Leave Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <ListOrdered size={20} color="var(--primary-400)" />
              Application Records ({filteredLeaves.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
            Loading applications...
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Doc Name</th>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Date Range</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Created At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "var(--text-dim)", padding: "3rem" }}>
                      No matching leave applications found.
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((leave) => (
                    <tr key={leave.name}>
                      <td>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-dim)" }}>
                          {leave.name}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: "600" }}>{leave.employee_name || leave.employee}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{leave.employee}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: "500" }}>{leave.leave_type}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.825rem", whiteSpace: "nowrap" }}>
                          {leave.from_date} <span style={{ color: "var(--text-dim)" }}>→</span> {leave.to_date}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: "700", color: "var(--primary-300)" }}>
                          {leave.total_leave_days}d
                        </span>
                      </td>
                      <td style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={leave.reason}>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          {leave.reason || "—"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.775rem", color: "var(--text-dim)" }}>
                          {leave.creation ? leave.creation.substring(0, 10) : "—"}
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
        )}
      </div>
    </div>
  );
}
